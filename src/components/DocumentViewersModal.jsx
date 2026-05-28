import { useState, useEffect } from 'react';
import { getDocumentViewers, getUploaderName } from '../lib/documentService';
import { X, Eye, Users, AlertTriangle, ArrowUpDown } from 'lucide-react';

function DocumentViewersModal({ isOpen, onClose, document: doc }) {
  var [viewers, setViewers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [sortBy, setSortBy] = useState('recent'); // 'recent' | 'alpha'

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
    function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
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

  // Consistent avatar color keyed to name
  var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
  function getAvatarColor(name) {
    var char = (name || 'A').charCodeAt(0);
    return AVATAR_COLORS[char % AVATAR_COLORS.length];
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

  var sortedViewers = viewers.slice().sort(function(a, b) {
    if (sortBy === 'alpha') {
      return getMemberName(a).localeCompare(getMemberName(b));
    }
    // recent: most recently viewed first
    return new Date(b.viewed_at) - new Date(a.viewed_at);
  });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{background:'rgba(0,0,0,0.45)'}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewers-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)', maxHeight:'85vh'}}
      >
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
              <h2 id="viewers-modal-title" style={{fontSize:'16px', fontWeight:800, color:'#0E1523', margin:0}}>
                Document Views
              </h2>
            </div>
            <p className="text-xs truncate" style={{color:'#64748B'}} title={doc.title}>
              {doc.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0 text-[#64748B] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close viewers list"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Sort bar — only shown when there are viewers */}
        {!loading && !error && viewers.length > 1 && (
          <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <span className="text-xs" style={{color:'#64748B'}}>
              {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
            </span>
            <div className="flex items-center gap-1" role="group" aria-label="Sort viewers">
              <ArrowUpDown className="w-3 h-3 text-[#94A3B8]" aria-hidden="true" />
              <button
                onClick={function() { setSortBy('recent'); }}
                aria-pressed={sortBy === 'recent'}
                className={'text-xs font-semibold px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (sortBy === 'recent' ? 'bg-blue-50 text-blue-600' : 'text-[#64748B] hover:text-[#0E1523]')}
              >
                Recent
              </button>
              <button
                onClick={function() { setSortBy('alpha'); }}
                aria-pressed={sortBy === 'alpha'}
                className={'text-xs font-semibold px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (sortBy === 'alpha' ? 'bg-blue-50 text-blue-600' : 'text-[#64748B] hover:text-[#0E1523]')}
              >
                A–Z
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="px-5 py-4 space-y-3" aria-busy="true" aria-label="Loading viewers">
              {[1,2,3,4].map(function(i) {
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-slate-200 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center" role="alert">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold mb-1" style={{color:'#0E1523'}}>Could Not Load Viewers</p>
              <p className="text-xs" style={{color:'#64748B'}}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && viewers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-slate-200">
                <Users className="w-5 h-5 text-[#64748B]" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold mb-1" style={{color:'#0E1523'}}>No Views Yet</p>
              <p className="text-xs" style={{color:'#64748B'}}>
                Members will appear here once they preview this document.
              </p>
            </div>
          )}

          {/* Viewer list */}
          {!loading && !error && sortedViewers.length > 0 && (
            <ul role="list" aria-label="Members who viewed this document">
              {sortedViewers.map(function(viewer, index) {
                var name = getMemberName(viewer);
                var initials = getInitials(viewer);
                var avatarColor = getAvatarColor(name);
                var isLast = index === sortedViewers.length - 1;

                return (
                  <li
                    key={viewer.member_id}
                    className={'flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 ' + (!isLast ? 'border-b border-slate-100' : '')}
                    aria-label={name + ' viewed this document'}
                  >
                    {viewer.member && viewer.member.avatar_url ? (
                      <img
                        src={viewer.member.avatar_url}
                        alt={name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-slate-200"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{background: avatarColor}}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{color:'#0E1523'}}>{name}</p>
                      <p className="text-xs" style={{color:'#64748B'}}>
                        {formatViewedAt(viewer.viewed_at)}
                      </p>
                    </div>

                    <Eye className="w-3.5 h-3.5 flex-shrink-0 text-[#94A3B8]" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && viewers.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 flex-shrink-0">
            <p className="text-xs text-center" style={{color:'#64748B'}}>
              {viewers.length} {viewers.length === 1 ? 'member has' : 'members have'} viewed this document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentViewersModal;