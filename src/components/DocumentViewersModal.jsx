import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getDocumentViewers, getUploaderName } from '../lib/documentService';
import { X, Eye, Users, Loader2, AlertTriangle } from 'lucide-react';

/**
 * DocumentViewersModal
 * Shows which members have viewed a document and when.
 * Admin/editor only — caller is responsible for gating.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - document: object (id, title)
 */
function DocumentViewersModal({ isOpen, onClose, document: doc }) {
  var { isDark } = useTheme();
  var [viewers, setViewers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  // Theme tokens
  var overlay = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50';
  var modalBg = isDark ? 'bg-[#1A2035]' : 'bg-white';
  var headerBorder = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPrimary = isDark ? 'text-white' : 'text-gray-900';
  var textSecondary = isDark ? 'text-[#CBD5E1]' : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  var rowBorder = isDark ? 'border-[#2A3550]' : 'border-gray-100';
  var avatarBg = isDark ? 'bg-[#1E2845]' : 'bg-gray-100';
  var emptyBorder = isDark ? 'border-[#2A3550]' : 'border-gray-200';

  useEffect(function() {
    if (!isOpen || !doc) return;
    setLoading(true);
    setError(null);

    async function load() {
      var result = await getDocumentViewers(doc.id);
      if (result.error) {
        setError(result.error);
      } else {
        setViewers(result.data || []);
      }
      setLoading(false);
    }

    load();
  }, [isOpen, doc]);

  useEffect(function() {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return function() { window.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  function getMemberName(viewer) {
    return getUploaderName(viewer.member);
  }

  function getInitials(viewer) {
    if (!viewer.member) return '?';
    var name = getMemberName(viewer);
    var parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function formatViewedAt(dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var diffMs = now - date;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    var diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min' + (diffMins === 1 ? '' : 's') + ' ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div
      className={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewers-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={'rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden ' + modalBg}>

        {/* Header */}
        <div className={'border-b px-6 py-4 flex items-start justify-between gap-4 flex-shrink-0 ' + headerBorder}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
              <h2
                id="viewers-modal-title"
                className={'text-base font-bold ' + textPrimary}
              >
                Document Views
              </h2>
            </div>
            <p className={'text-xs truncate ' + textMuted} title={doc.title}>
              {doc.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className={'p-2 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 '
              + (isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#2A3550]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}
            aria-label="Close viewers list"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '420px' }}>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3" role="status" aria-label="Loading viewers">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" aria-hidden="true" />
              <p className={'text-sm ' + textMuted}>Loading viewers...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center" role="alert">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-2" aria-hidden="true" />
              <p className={'text-sm font-semibold mb-1 ' + textPrimary}>Could Not Load Viewers</p>
              <p className={'text-xs ' + textMuted}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && viewers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className={'w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 border-dashed ' + emptyBorder}>
                <Users className={'w-5 h-5 ' + textMuted} aria-hidden="true" />
              </div>
              <p className={'text-sm font-semibold mb-1 ' + textPrimary}>No Views Yet</p>
              <p className={'text-xs ' + textMuted}>
                Members will appear here once they preview this document.
              </p>
            </div>
          )}

          {/* Viewer List */}
          {!loading && !error && viewers.length > 0 && (
            <ul role="list" aria-label="Members who viewed this document">
              {viewers.map(function(viewer, index) {
                var name = getMemberName(viewer);
                var initials = getInitials(viewer);
                var isLast = index === viewers.length - 1;

                return (
                  <li
                    key={viewer.member_id}
                    className={'flex items-center gap-3 px-6 py-3 ' + (!isLast ? 'border-b ' + rowBorder : '')}
                    aria-label={name + ' viewed this document'}
                  >
                    {/* Avatar */}
                    {viewer.member && viewer.member.avatar_url ? (
                      <img
                        src={viewer.member.avatar_url}
                        alt={name}
                        className={'w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 ' + (isDark ? 'border-[#2A3550]' : 'border-gray-200')}
                      />
                    ) : (
                      <div
                        className={'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400 ' + avatarBg}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                    )}

                    {/* Name + timestamp */}
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm font-semibold truncate ' + textPrimary}>{name}</p>
                      <p className={'text-xs ' + textMuted}>
                        Last viewed {formatViewedAt(viewer.viewed_at)}
                      </p>
                    </div>

                    {/* Eye icon indicator */}
                    <Eye className={'w-3.5 h-3.5 flex-shrink-0 ' + textMuted} aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer — view count summary */}
        {!loading && !error && viewers.length > 0 && (
          <div className={'border-t px-6 py-3 flex-shrink-0 ' + headerBorder}>
            <p className={'text-xs text-center ' + textMuted}>
              {viewers.length} {viewers.length === 1 ? 'member has' : 'members have'} viewed this document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentViewersModal;