/**
 * ContentEditor.jsx
 * Zero-code content editing for staff. Drop this in as the "Content" tab
 * inside StaffDashboard.jsx.
 *
 * Usage in StaffDashboard.jsx:
 *   import ContentEditor from './ContentEditor';
 *   // Add to TABS array: { key: 'content', label: 'Content', icon: FileText }
 *   // Add to tab render: {activeTab === 'content' && <ContentEditor />}
 *
 * Features:
 * - Groups fields by section (Homepage Hero, Features, Pricing, etc.)
 * - Inline editing — click any field, type, save
 * - Character counter on textarea fields
 * - SEO field shows Google preview
 * - All saves logged to staff_audit_log
 * - Changes go live on next page load — no deploy needed
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { fetchAllSiteContent, saveSiteContent } from '../hooks/useSiteContent';
import { Edit2, Check, X, AlertCircle, Globe, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function EditorSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: 3 }).map(function (_, si) {
        return (
          <div key={si} className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-[#2A3550] flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-[#2A3550]" />
              <div className="h-4 w-40 rounded bg-[#2A3550]" />
            </div>
            <div className="divide-y divide-[#2A3550]">
              {Array.from({ length: 3 }).map(function (_, fi) {
                return (
                  <div key={fi} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-[#2A3550]" />
                      <div className="h-8 w-full rounded bg-[#2A3550]" />
                    </div>
                    <div className="w-16 h-8 rounded bg-[#2A3550] mt-5" />
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

// ─── Google preview for SEO fields ───────────────────────────────────────────
function GooglePreview({ title, description }) {
  return (
    <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200 max-w-lg" aria-label="Google search preview">
      <p className="text-[11px] text-[#64748B] font-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Globe size={11} aria-hidden="true" />
        Google Preview
      </p>
      <p className="text-[#1a0dab] text-[16px] font-400 mb-0.5 truncate">{title || 'Page Title'}</p>
      <p className="text-[#006621] text-[12px] mb-0.5">syndicade.com</p>
      <p className="text-[#545454] text-[13px] leading-snug line-clamp-2">{description || 'Page description will appear here.'}</p>
    </div>
  );
}

// ─── Single editable field row ────────────────────────────────────────────────
function ContentField({ field, staffUserId, onSaved }) {
  var [editing, setEditing] = useState(false);
  var [draft, setDraft] = useState(field.value);
  var [saving, setSaving] = useState(false);
  var inputRef = useRef(null);

  var MAX_CHARS = field.field_type === 'textarea' ? (field.key === 'meta_description' ? 160 : 500) : 200;
  var isOverLimit = field.key === 'meta_description' && draft.length > 160;

  useEffect(function () {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function handleStartEdit() {
    setDraft(field.value);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(field.value);
    setEditing(false);
  }

  async function handleSave() {
    if (draft === field.value) { setEditing(false); return; }
    setSaving(true);

    var { error } = await saveSiteContent(field.key, draft, staffUserId);

    if (error) {
      toast.error('Failed to save. Try again.');
      setSaving(false);
      return;
    }

    // Log to audit
    var { data: { user } } = await supabase.auth.getUser();
    await supabase.from('staff_audit_log').insert({
      staff_user_id: user.id,
      action: 'content_updated',
      target_type: 'site_content',
      target_id: field.key,
      details: { label: field.label, old_value: field.value.slice(0, 100), new_value: draft.slice(0, 100) },
    });

    toast.success('"' + field.label + '" updated.');
    setSaving(false);
    setEditing(false);
    onSaved(field.key, draft);
  }

  function handleKeyDown(e) {
    if (field.field_type === 'text' && e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  }

  var isEmpty = !field.value || field.value.trim() === '';

  return (
    <div className={'px-6 py-4 border-b border-[#2A3550] last:border-b-0 ' + (editing ? 'bg-[#1E2845]' : 'hover:bg-[#1A2035]/60')}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Label + description */}
          <div className="flex items-center gap-2 mb-1.5">
            <label htmlFor={'field-' + field.key} className="text-[13px] font-700 text-white">
              {field.label}
            </label>
            {isEmpty && (
              <span className="text-[10px] font-700 text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">
                Empty
              </span>
            )}
          </div>
          {field.description && (
            <p className="text-[12px] text-[#64748B] mb-2">{field.description}</p>
          )}

          {/* Input */}
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
                  className={'w-full bg-[#0E1523] border rounded-lg px-3 py-2 text-[14px] text-[#CBD5E1] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isOverLimit ? 'border-red-500' : 'border-[#3B82F6]')}
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
                  className="w-full bg-[#0E1523] border border-[#3B82F6] rounded-lg px-3 py-2 text-[14px] text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby={field.key + '-hint'}
                />
              )}

              {/* Character counter for textarea */}
              {field.field_type === 'textarea' && (
                <div id={field.key + '-hint'} className={'flex items-center justify-between mt-1 ' + (isOverLimit ? 'text-red-400' : 'text-[#64748B]')}>
                  <span className="text-[11px]">
                    {isOverLimit && <AlertCircle size={11} className="inline mr-1" aria-hidden="true" />}
                    {draft.length}{field.key === 'meta_description' ? ' / 160 recommended' : ' characters'}
                  </span>
                  <span className="text-[11px]">Press Esc to cancel</span>
                </div>
              )}

              {/* Google preview for SEO fields */}
              {field.key === 'meta_description' && (
                <GooglePreview title="Syndicade — Where Community Work Connects" description={draft} />
              )}
              {field.key === 'meta_title' && (
                <GooglePreview title={draft} description="Update your meta description too." />
              )}
            </div>
          ) : (
            <div
              className="text-[14px] text-[#CBD5E1] cursor-pointer group"
              onClick={handleStartEdit}
              role="button"
              tabIndex={0}
              onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') handleStartEdit(); }}
              aria-label={'Edit ' + field.label}
            >
              {isEmpty ? (
                <span className="text-[#64748B] italic">Click to add content...</span>
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
                onClick={handleSave}
                disabled={saving || isOverLimit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-[12px] font-700 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                aria-label={'Save ' + field.label}
              >
                <Check size={13} aria-hidden="true" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2035] border border-[#2A3550] text-[#94A3B8] text-[12px] font-600 rounded-lg hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                aria-label="Cancel edit"
              >
                <X size={13} aria-hidden="true" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2035] border border-[#2A3550] text-[#94A3B8] text-[12px] font-600 rounded-lg hover:border-blue-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={'Edit ' + field.label}
            >
              <Edit2 size={13} aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section group ────────────────────────────────────────────────────────────
function ContentSection({ sectionName, fields, staffUserId, onFieldSaved }) {
  var [collapsed, setCollapsed] = useState(false);
  var emptyCount = fields.filter(function (f) { return !f.value || f.value.trim() === ''; }).length;

  return (
    <div className="bg-[#151B2D] border border-[#2A3550] rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={function () { setCollapsed(!collapsed); }}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-[#2A3550] hover:bg-[#1A2035] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
        aria-expanded={!collapsed}
        aria-controls={'section-' + sectionName.replace(/\s/g, '-')}
      >
        <div className="flex items-center gap-3">
          {collapsed ? <ChevronRight size={15} className="text-[#64748B]" aria-hidden="true" /> : <ChevronDown size={15} className="text-[#64748B]" aria-hidden="true" />}
          <span className="text-[13px] font-700 text-white">{sectionName}</span>
          <span className="text-[11px] text-[#64748B]">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
          {emptyCount > 0 && (
            <span className="text-[10px] font-700 text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">
              {emptyCount} empty
            </span>
          )}
        </div>
      </button>

      {/* Fields */}
      {!collapsed && (
        <div id={'section-' + sectionName.replace(/\s/g, '-')} className="bg-[#1A2035]">
          {fields.map(function (field) {
            return (
              <ContentField
                key={field.key}
                field={field}
                staffUserId={staffUserId}
                onSaved={onFieldSaved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ContentEditor component ─────────────────────────────────────────────
export default function ContentEditor({ staffUserId }) {
  var [allFields, setAllFields] = useState([]);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [searchQuery, setSearchQuery] = useState('');

  useEffect(function () { loadContent(); }, []);

  async function loadContent(showRefresh) {
    if (showRefresh) setRefreshing(true);
    var { data } = await fetchAllSiteContent();
    setAllFields(data);
    setLoading(false);
    setRefreshing(false);
  }

  // Update local state after a save — no full reload needed
  function handleFieldSaved(key, newValue) {
    setAllFields(function (prev) {
      return prev.map(function (f) {
        return f.key === key ? Object.assign({}, f, { value: newValue }) : f;
      });
    });
  }

  // Group fields by section
  var filteredFields = searchQuery.trim()
    ? allFields.filter(function (f) {
        var q = searchQuery.toLowerCase();
        return f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q) || f.section.toLowerCase().includes(q);
      })
    : allFields;

  var sections = {};
  filteredFields.forEach(function (field) {
    if (!sections[field.section]) sections[field.section] = [];
    sections[field.section].push(field);
  });

  var sectionNames = Object.keys(sections).sort();
  var totalEmpty = allFields.filter(function (f) { return !f.value || f.value.trim() === ''; }).length;

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#94A3B8]">
            Edit any field below and click Save. Changes go live on the next page load — no code, no deploys.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {totalEmpty > 0 && (
            <span className="text-[12px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg font-600">
              {totalEmpty} empty field{totalEmpty !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={function () { loadContent(true); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2035] border border-[#2A3550] rounded-lg text-[13px] text-[#CBD5E1] font-600 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            aria-label="Refresh content"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <label htmlFor="content-search" className="sr-only">Search content fields</label>
        <input
          id="content-search"
          type="search"
          value={searchQuery}
          onChange={function (e) { setSearchQuery(e.target.value); }}
          placeholder="Search fields by name, section, or current value..."
          className="w-full bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[14px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[#64748B]"
          autoComplete="off"
        />
      </div>

      {/* Content sections */}
      {loading ? (
        <EditorSkeleton />
      ) : sectionNames.length === 0 ? (
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl px-6 py-12 text-center">
          <Edit2 size={36} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
          <p className="text-white font-700 text-[15px] mb-1">
            {searchQuery ? 'No fields match your search' : 'No content fields found'}
          </p>
          <p className="text-[13px] text-[#64748B]">
            {searchQuery ? 'Try a different search term.' : 'Run the site_content SQL migration first.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Content sections">
          {sectionNames.map(function (sectionName) {
            return (
              <div key={sectionName} role="listitem">
                <ContentSection
                  sectionName={sectionName}
                  fields={sections[sectionName]}
                  staffUserId={staffUserId}
                  onFieldSaved={handleFieldSaved}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      {!loading && (
        <p className="text-[12px] text-[#64748B] text-center mt-6">
          To add new editable fields, insert a row into the <span className="font-mono text-[#94A3B8]">site_content</span> table in Supabase. No code changes needed.
        </p>
      )}
    </div>
  );
}