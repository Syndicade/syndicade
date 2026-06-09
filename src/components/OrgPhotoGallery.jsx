import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-4 w-4'} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function (d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

var ICONS = {
  photo:     ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  folder:    'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  folderAdd: ['M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
  x:         'M6 18L18 6M6 6l12 12',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  warn:      ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  expand:    ['M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'],
  pencil:    ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  chevLeft:  'M15 19l-7-7 7-7',
  chevRight: 'M9 5l7 7-7 7',
  download:  ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'],
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  plus:      'M12 4v16m8-8H4',
  check:     'M5 13l4 4L19 7',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  location:  ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  star:      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  filter:    ['M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'],
  upload:    ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
  dots:      ['M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'],
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

var inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #E2E8F0', background: '#F8FAFC',
  color: '#0E1523', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

function FieldLabel({ htmlFor, label }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
      {label}
    </label>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(function () {
    if (!isOpen) return;
    function h(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', h);
    return function () { document.removeEventListener('keydown', h); };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '16px' }} role="dialog" aria-modal="true" aria-labelledby="confirm-gallery-title" onClick={function (e) { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 14px rgba(0,0,0,0.12)' }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-gallery-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0E1523', margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} autoFocus style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// ── UploadModal ───────────────────────────────────────────────────────────────
function UploadModal({ folders, defaultFolderId, organizationId, currentUserId, organizationName, onClose, onUploaded }) {
  var [queue, setQueue]         = useState([]);   // [{file, preview, caption, taken_at, location}]
  var [folderId, setFolderId]   = useState(defaultFolderId || '');
  var [uploading, setUploading] = useState(false);
  var [progress, setProgress]   = useState(0);
  var [error, setError]         = useState(null);
  var dropRef                   = useRef(null);

  useEffect(function () {
    function h(e) { if (e.key === 'Escape' && !uploading) onClose(); }
    document.addEventListener('keydown', h);
    return function () { document.removeEventListener('keydown', h); };
  }, [uploading]);

  function addFiles(files) {
    var allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    var valid = Array.from(files).filter(function (f) { return allowed.includes(f.type) && f.size <= 5 * 1024 * 1024; });
    if (valid.length < files.length) setError('Some files were skipped — only JPG, PNG, GIF, WebP under 5 MB allowed.');
    var items = valid.map(function (f) { return { file: f, preview: URL.createObjectURL(f), caption: '', taken_at: '', location: '', id: Math.random().toString(36).slice(2) }; });
    setQueue(function (prev) { return prev.concat(items); });
  }

  function removeItem(id) {
    setQueue(function (prev) { return prev.filter(function (i) { return i.id !== id; }); });
  }

  function updateItem(id, key, val) {
    setQueue(function (prev) { return prev.map(function (i) { return i.id === id ? Object.assign({}, i, { [key]: val }) : i; }); });
  }

  function handleDrop(e) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (queue.length === 0) return;
    setUploading(true);
    setError(null);
    var failed = 0;
    for (var idx = 0; idx < queue.length; idx++) {
      var item = queue[idx];
      try {
        var ext      = item.file.name.split('.').pop();
        var fileName = organizationId + '/' + Date.now() + '_' + idx + '.' + ext;
        var upResult = await supabase.storage.from('organization-images').upload(fileName, item.file, { upsert: false });
        if (upResult.error) throw upResult.error;
        var urlData  = supabase.storage.from('organization-images').getPublicUrl(fileName);
        var ins = await supabase.from('org_photos').insert({
          organization_id: organizationId,
          uploaded_by:     currentUserId,
          photo_url:       urlData.data.publicUrl,
          caption:         item.caption.trim()  || null,
          taken_at:        item.taken_at         || null,
          location:        item.location.trim() || null,
          folder_id:       folderId              || null,
        });
        if (ins.error) throw ins.error;
      } catch (e) {
        console.error('upload item failed:', e);
        failed++;
      }
      setProgress(Math.round(((idx + 1) / queue.length) * 100));
    }
    setUploading(false);
    if (failed > 0) {
      setError(failed + ' photo' + (failed > 1 ? 's' : '') + ' failed to upload.');
    }
    var succeeded = queue.length - failed;
    if (succeeded > 0) {
      mascotSuccessToast(succeeded + ' photo' + (succeeded > 1 ? 's' : '') + ' uploaded!');
      try {
        var notifModule = await import('../lib/notificationService');
        await notifModule.notifyOrganizationMembers({
          organizationId: organizationId,
          type:           'new_photo',
          title:          'New Photo' + (succeeded > 1 ? 's' : '') + ' Added',
          message:        (organizationName || 'Your organization') + ' added ' + succeeded + ' new photo' + (succeeded > 1 ? 's' : '') + ' to the gallery.',
          link:           '/organizations/' + organizationId + '/photos',
          excludeUserId:  currentUserId,
        });
        window.dispatchEvent(new CustomEvent('notificationCreated'));
      } catch (ne) { console.error('Photo notification failed:', ne); }
    }
    onUploaded();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: '16px' }} role="dialog" aria-modal="true" aria-labelledby="upload-modal-title" onClick={function (e) { if (e.target === e.currentTarget && !uploading) onClose(); }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={function (e) { e.stopPropagation(); }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <h2 id="upload-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: '#0E1523', margin: 0 }}>Upload Photos</h2>
          <button onClick={onClose} disabled={uploading} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', color: '#94A3B8' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={function (e) { e.preventDefault(); }}
            style={{ border: '2px dashed #E2E8F0', borderRadius: '10px', padding: '32px 20px', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer' }}
            onClick={function () { var inp = document.getElementById('bulk-file-input'); if (inp) inp.click(); }}
            role="button"
            tabIndex={0}
            aria-label="Drop photos here or click to choose"
            onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { var inp = document.getElementById('bulk-file-input'); if (inp) inp.click(); } }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Icon path={ICONS.upload} className="h-5 w-5" style={{ color: '#3B82F6' }} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0E1523', margin: '0 0 4px' }}>Drop photos here or click to browse</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>JPG, PNG, GIF, WebP · Max 5 MB each · Multiple files supported</p>
            <input id="bulk-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={function (e) { addFiles(e.target.files); e.target.value = ''; }} className="sr-only" aria-label="Choose photos" />
          </div>

          {/* Folder selector */}
          <div>
            <FieldLabel htmlFor="upload-folder" label="Add to Folder" />
            <select id="upload-folder" value={folderId} onChange={function (e) { setFolderId(e.target.value); }} style={Object.assign({}, inputStyle, { cursor: 'pointer' })} className="focus:ring-2 focus:ring-blue-500">
              <option value="">No folder (All Photos)</option>
              {folders.map(function (f) { return <option key={f.id} value={f.id}>{f.name}</option>; })}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }} role="alert">
              <Icon path={ICONS.warn} className="h-4 w-4" style={{ color: '#EF4444', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Queue */}
          {queue.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} role="list" aria-label="Photos to upload">
              {queue.map(function (item) {
                return (
                  <div key={item.id} role="listitem" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    {/* Thumbnail */}
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                      <img src={item.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {/* Fields */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '140px' }}>
                          <label htmlFor={'q-cap-' + item.id} style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '4px' }}>Caption</label>
                          <input id={'q-cap-' + item.id} type="text" value={item.caption} onChange={function (e) { updateItem(item.id, 'caption', e.target.value); }} placeholder="Optional caption" maxLength={200} style={Object.assign({}, inputStyle, { padding: '6px 10px', fontSize: '12px' })} className="focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label htmlFor={'q-date-' + item.id} style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '4px' }}>Date Taken</label>
                          <input id={'q-date-' + item.id} type="date" value={item.taken_at} onChange={function (e) { updateItem(item.id, 'taken_at', e.target.value); }} style={Object.assign({}, inputStyle, { padding: '6px 10px', fontSize: '12px' })} className="focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label htmlFor={'q-loc-' + item.id} style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '4px' }}>Location</label>
                          <input id={'q-loc-' + item.id} type="text" value={item.location} onChange={function (e) { updateItem(item.id, 'location', e.target.value); }} placeholder="e.g. Community Center" maxLength={120} style={Object.assign({}, inputStyle, { padding: '6px 10px', fontSize: '12px' })} className="focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                    {/* Remove */}
                    <button onClick={function () { removeItem(item.id); }} style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }} className="hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label="Remove photo from queue">
                      <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: 0 }}>Uploading...</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{progress + '%'}</p>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: progress + '%', height: '100%', background: '#3B82F6', borderRadius: '99px', transition: 'width 0.2s' }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
          <button onClick={onClose} disabled={uploading} style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }} className="focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleUpload} disabled={queue.length === 0 || uploading} style={{ flex: 2, padding: '10px', background: queue.length === 0 || uploading ? '#F1F5F9' : '#3B82F6', color: queue.length === 0 || uploading ? '#94A3B8' : '#fff', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: queue.length === 0 || uploading ? 'not-allowed' : 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
            {uploading ? 'Uploading...' : 'Upload ' + (queue.length > 0 ? queue.length + ' Photo' + (queue.length > 1 ? 's' : '') : 'Photos')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditPhotoModal ────────────────────────────────────────────────────────────
function EditPhotoModal({ photo, folders, onClose, onSave }) {
  var [form, setForm]     = useState({ caption: photo.caption || '', taken_at: photo.taken_at || '', location: photo.location || '', is_featured: photo.is_featured || false, folder_id: photo.folder_id || '' });
  var [saving, setSaving] = useState(false);

  useEffect(function () {
    function h(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', h);
    return function () { document.removeEventListener('keydown', h); };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      var payload = { caption: form.caption.trim() || null, taken_at: form.taken_at || null, location: form.location.trim() || null, is_featured: form.is_featured, folder_id: form.folder_id || null };
      var r = await supabase.from('org_photos').update(payload).eq('id', photo.id);
      if (r.error) throw r.error;
      mascotSuccessToast('Photo updated!');
      onSave(Object.assign({}, photo, payload));
      onClose();
    } catch (err) {
      mascotErrorToast('Could not save changes.', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: '16px' }} role="dialog" aria-modal="true" aria-labelledby="edit-photo-title" onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h2 id="edit-photo-title" style={{ fontSize: '17px', fontWeight: 800, color: '#0E1523', margin: 0 }}>Edit Photo</h2>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
        </div>
        <div style={{ padding: '16px 24px 0' }}>
          <img src={photo.photo_url} alt={photo.caption || 'Photo preview'} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><FieldLabel htmlFor="ep-caption" label="Caption" /><input id="ep-caption" type="text" value={form.caption} onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { caption: e.target.value }); }); }} placeholder="Describe this photo" maxLength={200} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" /></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><FieldLabel htmlFor="ep-date" label="Date Taken" /><input id="ep-date" type="date" value={form.taken_at} onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { taken_at: e.target.value }); }); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" /></div>
            <div style={{ flex: 1 }}><FieldLabel htmlFor="ep-location" label="Location" /><input id="ep-location" type="text" value={form.location} onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { location: e.target.value }); }); }} placeholder="e.g. Community Center" maxLength={120} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div>
            <FieldLabel htmlFor="ep-folder" label="Folder" />
            <select id="ep-folder" value={form.folder_id} onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { folder_id: e.target.value }); }); }} style={Object.assign({}, inputStyle, { cursor: 'pointer' })} className="focus:ring-2 focus:ring-blue-500">
              <option value="">No folder</option>
              {folders.map(function (f) { return <option key={f.id} value={f.id}>{f.name}</option>; })}
            </select>
          </div>
          {/* Featured toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523', margin: '0 0 2px' }}>Featured photo</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Highlighted at the top of the gallery</p>
            </div>
            <button onClick={function () { setForm(function (f) { return Object.assign({}, f, { is_featured: !f.is_featured }); }); }} aria-pressed={form.is_featured} aria-label="Toggle featured" style={{ width: '40px', height: '22px', borderRadius: '99px', background: form.is_featured ? '#F5B731' : '#E2E8F0', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }} className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1">
              <span style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', top: '2px', left: form.is_featured ? '20px' : '2px', transition: 'left 0.15s' }} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #F1F5F9' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photo, photos, onClose, onNavigate }) {
  useEffect(function () {
    function h(e) { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') onNavigate(-1); if (e.key === 'ArrowRight') onNavigate(1); }
    document.addEventListener('keydown', h);
    return function () { document.removeEventListener('keydown', h); };
  }, [photo]);
  if (!photo) return null;
  var idx     = photos.findIndex(function (p) { return p.id === photo.id; });
  var hasPrev = idx > 0;
  var hasNext = idx < photos.length - 1;
  function download() {
    var a = document.createElement('a');
    a.href = photo.photo_url; a.download = (photo.caption || 'photo') + '.' + photo.photo_url.split('.').pop().split('?')[0]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click();
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }} role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom,rgba(0,0,0,0.5),transparent)' }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0 }}>{photos.length > 1 ? (idx + 1) + ' / ' + photos.length : ''}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={function (e) { e.stopPropagation(); download(); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 600 }} className="hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Download photo"><Icon path={ICONS.download} className="h-4 w-4" />Download</button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} className="hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Close photo viewer"><Icon path={ICONS.x} className="h-4 w-4" strokeWidth={2.5} /></button>
        </div>
      </div>
      {hasPrev && <button onClick={function (e) { e.stopPropagation(); onNavigate(-1); }} style={{ position: 'absolute', left: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} className="hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Previous photo"><Icon path={ICONS.chevLeft} className="h-5 w-5" /></button>}
      <div style={{ position: 'relative', maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }} onClick={function (e) { e.stopPropagation(); }}>
        <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '10px' }} />
        {(photo.caption || photo.taken_at || photo.location) && (
          <div style={{ textAlign: 'center' }}>
            {photo.caption && <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>{photo.caption}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {photo.taken_at && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}><Icon path={ICONS.calendar} className="h-3 w-3" />{formatDate(photo.taken_at)}</span>}
              {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}><Icon path={ICONS.location} className="h-3 w-3" />{photo.location}</span>}
            </div>
          </div>
        )}
      </div>
      {hasNext && <button onClick={function (e) { e.stopPropagation(); onNavigate(1); }} style={{ position: 'absolute', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} className="hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Next photo"><Icon path={ICONS.chevRight} className="h-5 w-5" /></button>}
    </div>
  );
}

// ── OrgPhotoGallery ───────────────────────────────────────────────────────────
function OrgPhotoGallery({ organizationId, currentUserId, isAdmin, organizationName }) {
  var [photos, setPhotos]                   = useState([]);
  var [folders, setFolders]                 = useState([]);
  var [photosLoading, setPhotosLoading]     = useState(true);
  var [foldersLoading, setFoldersLoading]   = useState(true);
  var [activeFolderId, setActiveFolderId]   = useState(null);  // null = All Photos
  var [hoveredPhotoId, setHoveredPhotoId]   = useState(null);
  var [deletingPhotoId, setDeletingPhotoId] = useState(null);
  var [lightboxPhoto, setLightboxPhoto]     = useState(null);
  var [editingPhoto, setEditingPhoto]       = useState(null);
  var [showUploadModal, setShowUploadModal] = useState(false);
  var [searchQuery, setSearchQuery]         = useState('');
  var [filterDateFrom, setFilterDateFrom]   = useState('');
  var [filterDateTo, setFilterDateTo]       = useState('');
  var [showFilters, setShowFilters]         = useState(false);
  var [dragId, setDragId]                   = useState(null);
  var [dragOverId, setDragOverId]           = useState(null);
  // Folder management
  var [newFolderName, setNewFolderName]     = useState('');
  var [addingFolder, setAddingFolder]       = useState(false);
  var [savingFolder, setSavingFolder]       = useState(false);
  var [renamingFolderId, setRenamingFolderId] = useState(null);
  var [renamingValue, setRenamingValue]     = useState('');
  var [confirmModal, setConfirmModal]       = useState({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });

  useEffect(function () { fetchFolders(); fetchPhotos(); }, [organizationId]);

  function openConfirm(title, message, confirmLabel, onConfirm) { setConfirmModal({ open: true, title: title, message: message, confirmLabel: confirmLabel, onConfirm: onConfirm }); }
  function closeConfirm() { setConfirmModal({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null }); }

  async function fetchFolders() {
    setFoldersLoading(true);
    try {
      var r = await supabase.from('org_photo_folders').select('*').eq('organization_id', organizationId).order('sort_order').order('created_at');
      if (r.error) throw r.error;
      setFolders(r.data || []);
    } catch (err) { console.error('fetchFolders:', err); }
    finally { setFoldersLoading(false); }
  }

  async function fetchPhotos() {
    setPhotosLoading(true);
    try {
      var r = await supabase.from('org_photos').select('*').eq('organization_id', organizationId).order('sort_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
      if (r.error) throw r.error;
      setPhotos(r.data || []);
    } catch (err) { console.error('fetchPhotos:', err); toast.error('Could not load photos.'); }
    finally { setPhotosLoading(false); }
  }

  // ── Folder actions ──────────────────────────────────────────────────────────
  async function handleCreateFolder() {
    var name = newFolderName.trim();
    if (!name) return;
    setSavingFolder(true);
    try {
      var r = await supabase.from('org_photo_folders').insert({ organization_id: organizationId, name: name }).select().single();
      if (r.error) throw r.error;
      setFolders(function (prev) { return prev.concat([r.data]); });
      setNewFolderName('');
      setAddingFolder(false);
      mascotSuccessToast('Folder created!');
    } catch (err) { toast.error('Could not create folder.'); }
    finally { setSavingFolder(false); }
  }

  async function handleRenameFolder(folder) {
    var name = renamingValue.trim();
    if (!name || name === folder.name) { setRenamingFolderId(null); return; }
    try {
      var r = await supabase.from('org_photo_folders').update({ name: name }).eq('id', folder.id);
      if (r.error) throw r.error;
      setFolders(function (prev) { return prev.map(function (f) { return f.id === folder.id ? Object.assign({}, f, { name: name }) : f; }); });
      setRenamingFolderId(null);
      mascotSuccessToast('Folder renamed.');
    } catch (err) { toast.error('Could not rename folder.'); }
  }

  function handleDeleteFolder(folder) {
    var count = photos.filter(function (p) { return p.folder_id === folder.id; }).length;
    openConfirm(
      'Delete "' + folder.name + '"?',
      count > 0
        ? count + ' photo' + (count > 1 ? 's' : '') + ' will be moved to All Photos. The photos themselves will not be deleted.'
        : 'This folder is empty and will be permanently removed.',
      'Delete Folder',
      async function () {
        closeConfirm();
        try {
          var r = await supabase.from('org_photo_folders').delete().eq('id', folder.id);
          if (r.error) throw r.error;
          setFolders(function (prev) { return prev.filter(function (f) { return f.id !== folder.id; }); });
          setPhotos(function (prev) { return prev.map(function (p) { return p.folder_id === folder.id ? Object.assign({}, p, { folder_id: null }) : p; }); });
          if (activeFolderId === folder.id) setActiveFolderId(null);
          mascotSuccessToast('Folder deleted.');
        } catch (err) { mascotErrorToast('Could not delete folder.'); }
      }
    );
  }

  // ── Photo actions ───────────────────────────────────────────────────────────
  function handleDeletePhoto(photo) {
    openConfirm(
      'Delete this photo?',
      (photo.caption ? '"' + photo.caption + '" will be' : 'This photo will be') + ' permanently deleted.',
      'Delete Photo',
      async function () {
        closeConfirm();
        try {
          setDeletingPhotoId(photo.id);
          var parts = photo.photo_url.split('/organization-images/');
          if (parts.length === 2) await supabase.storage.from('organization-images').remove([parts[1]]);
          var r = await supabase.from('org_photos').delete().eq('id', photo.id);
          if (r.error) throw r.error;
          setPhotos(function (prev) { return prev.filter(function (p) { return p.id !== photo.id; }); });
          if (lightboxPhoto && lightboxPhoto.id === photo.id) setLightboxPhoto(null);
          mascotSuccessToast('Photo deleted.');
        } catch (err) { mascotErrorToast('Could not delete photo.'); }
        finally { setDeletingPhotoId(null); }
      }
    );
  }

  function handleEditSave(updated) {
    setPhotos(function (prev) { return prev.map(function (p) { return p.id === updated.id ? updated : p; }); });
    if (lightboxPhoto && lightboxPhoto.id === updated.id) setLightboxPhoto(updated);
  }

  // ── Drag reorder ────────────────────────────────────────────────────────────
  function onDragStart(id) { setDragId(id); }
  function onDragEnter(id) { setDragOverId(id); }
  async function onDragEnd() {
    if (!dragId || !dragOverId || dragId === dragOverId) { setDragId(null); setDragOverId(null); return; }
    var arr     = photos.slice();
    var fromIdx = arr.findIndex(function (p) { return p.id === dragId; });
    var toIdx   = arr.findIndex(function (p) { return p.id === dragOverId; });
    if (fromIdx === -1 || toIdx === -1) { setDragId(null); setDragOverId(null); return; }
    var moved = arr.splice(fromIdx, 1)[0];
    arr.splice(toIdx, 0, moved);
    setPhotos(arr);
    setDragId(null); setDragOverId(null);
    try { await Promise.all(arr.map(function (p, i) { return supabase.from('org_photos').update({ sort_order: i }).eq('id', p.id); })); } catch (e) { console.error('sort_order save:', e); }
  }

  // ── Filtered + sorted photos ─────────────────────────────────────────────────
  var visiblePhotos = photos.filter(function (p) {
    if (activeFolderId !== null && p.folder_id !== activeFolderId) return false;
    var q = searchQuery.toLowerCase().trim();
    if (q && !(p.caption && p.caption.toLowerCase().includes(q)) && !(p.location && p.location.toLowerCase().includes(q))) return false;
    if (filterDateFrom && p.taken_at && p.taken_at < filterDateFrom) return false;
    if (filterDateTo   && p.taken_at && p.taken_at > filterDateTo)   return false;
    return true;
  }).sort(function (a, b) {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  var hasActiveFilter = !!(searchQuery || filterDateFrom || filterDateTo);

  function folderCount(fid) { return photos.filter(function (p) { return p.folder_id === fid; }).length; }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', margin: 0 }}>Photo Gallery</h1>
          {!photosLoading && <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{photos.length + ' photo' + (photos.length !== 1 ? 's' : '') + (hasActiveFilter ? ' · ' + visiblePhotos.length + ' shown' : '')}</p>}
        </div>
        {isAdmin && (
          <button
            onClick={function () { setShowUploadModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon path={ICONS.upload} className="h-4 w-4" />
            Upload Photos
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Folder sidebar */}
        <nav style={{ width: '200px', flexShrink: 0 }} aria-label="Photo folders">
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '3px 4px 14px rgba(0,0,0,0.04)' }}>

            {/* All Photos */}
            <button
              onClick={function () { setActiveFolderId(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: activeFolderId === null ? 'rgba(59,130,246,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
              aria-current={activeFolderId === null ? 'true' : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon path={ICONS.photo} className="h-4 w-4" style={{ color: activeFolderId === null ? '#3B82F6' : '#94A3B8' }} />
                <span style={{ fontSize: '13px', fontWeight: activeFolderId === null ? 700 : 500, color: activeFolderId === null ? '#1D4ED8' : '#475569' }}>All Photos</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{photos.length}</span>
            </button>

            {/* Folders */}
            {foldersLoading ? (
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[1, 2].map(function (i) { return <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />; })}
              </div>
            ) : (
              folders.map(function (folder) {
                var isActive = activeFolderId === folder.id;
                var isRenaming = renamingFolderId === folder.id;
                return (
                  <div key={folder.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {isRenaming ? (
                      <div style={{ padding: '8px 10px', display: 'flex', gap: '4px' }}>
                        <input
                          type="text" value={renamingValue} autoFocus
                          onChange={function (e) { setRenamingValue(e.target.value); }}
                          onKeyDown={function (e) { if (e.key === 'Enter') handleRenameFolder(folder); if (e.key === 'Escape') setRenamingFolderId(null); }}
                          onBlur={function () { handleRenameFolder(folder); }}
                          style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid #BFDBFE', borderRadius: '6px', outline: 'none', color: '#0E1523' }}
                          aria-label="Rename folder"
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                        <button
                          onClick={function () { setActiveFolderId(folder.id); }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                          className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <Icon path={ICONS.folder} className="h-4 w-4" style={{ color: isActive ? '#3B82F6' : '#94A3B8', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#1D4ED8' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, flexShrink: 0, marginLeft: '4px' }}>{folderCount(folder.id)}</span>
                        </button>
                        {isAdmin && (
                          <div style={{ display: 'flex', paddingRight: '6px', gap: '2px' }}>
                            <button onClick={function () { setRenamingFolderId(folder.id); setRenamingValue(folder.name); }} style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }} className="hover:bg-slate-100 hover:text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400" aria-label={'Rename folder ' + folder.name}>
                              <Icon path={ICONS.pencil} className="h-3 w-3" />
                            </button>
                            <button onClick={function () { handleDeleteFolder(folder); }} style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }} className="hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-1 focus:ring-red-400" aria-label={'Delete folder ' + folder.name}>
                              <Icon path={ICONS.trash} className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Add folder */}
            {isAdmin && (
              <div style={{ padding: '8px 10px' }}>
                {addingFolder ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text" value={newFolderName} autoFocus placeholder="Folder name"
                      onChange={function (e) { setNewFolderName(e.target.value); }}
                      onKeyDown={function (e) { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); } }}
                      style={{ flex: 1, padding: '5px 8px', fontSize: '12px', border: '1px solid #BFDBFE', borderRadius: '6px', outline: 'none', color: '#0E1523' }}
                      maxLength={60}
                      aria-label="New folder name"
                    />
                    <button onClick={handleCreateFolder} disabled={savingFolder || !newFolderName.trim()} style={{ width: '28px', height: '28px', background: '#3B82F6', border: 'none', borderRadius: '6px', cursor: newFolderName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, opacity: newFolderName.trim() ? 1 : 0.4 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Save folder">
                      <Icon path={ICONS.check} className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <button onClick={function () { setAddingFolder(false); setNewFolderName(''); }} style={{ width: '28px', height: '28px', background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cancel">
                      <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button onClick={function () { setAddingFolder(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '6px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#94A3B8', borderRadius: '6px' }} className="hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <Icon path={ICONS.plus} className="h-3.5 w-3.5" />
                    New folder
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Search + filter bar */}
          {photos.length > 0 && (
            <div style={{ marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Icon path={ICONS.search} className="h-4 w-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input type="search" placeholder="Search by caption or location..." value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value); }} style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0E1523', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} className="focus:ring-2 focus:ring-blue-500" aria-label="Search photos" />
              </div>
              <button onClick={function () { setShowFilters(function (p) { return !p; }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid ' + (showFilters || filterDateFrom || filterDateTo ? 'rgba(59,130,246,0.4)' : '#E2E8F0'), borderRadius: '8px', background: showFilters || filterDateFrom || filterDateTo ? 'rgba(59,130,246,0.06)' : '#FFFFFF', color: showFilters || filterDateFrom || filterDateTo ? '#2563EB' : '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-400" aria-expanded={showFilters}>
                <Icon path={ICONS.filter} className="h-4 w-4" />
                Filter
                {(filterDateFrom || filterDateTo) && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3B82F6' }} aria-hidden="true" />}
              </button>
              {hasActiveFilter && <button onClick={function () { setSearchQuery(''); setFilterDateFrom(''); setFilterDateTo(''); }} style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Clear</button>}
            </div>
          )}

          {/* Date filter panel */}
          {showFilters && (
            <div style={{ marginBottom: '14px', padding: '14px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="filter-from" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Date From</label>
                <input id="filter-from" type="date" value={filterDateFrom} onChange={function (e) { setFilterDateFrom(e.target.value); }} style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '7px', fontSize: '13px', color: '#0E1523', outline: 'none' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="filter-to" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Date To</label>
                <input id="filter-to" type="date" value={filterDateTo} onChange={function (e) { setFilterDateTo(e.target.value); }} style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '7px', fontSize: '13px', color: '#0E1523', outline: 'none' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              {isAdmin && <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, paddingBottom: '2px' }}>Drag photos to reorder. Order is saved automatically.</p>}
            </div>
          )}

          {/* Grid */}
          {photosLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '14px' }} aria-busy="true">
              {[1,2,3,4,5,6].map(function (i) { return <div key={i} style={{ height: '180px', borderRadius: '10px', background: '#F1F5F9' }} className="animate-pulse" />; })}
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Icon path={ICONS.photo} className="h-7 w-7" style={{ color: '#CBD5E1' }} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>No photos yet</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: isAdmin ? '14px' : 0 }}>{isAdmin ? 'Upload your first photo to get started.' : 'No photos have been added yet.'}</p>
              {isAdmin && <button onClick={function () { setShowUploadModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><Icon path={ICONS.upload} className="h-4 w-4" />Upload Photos</button>}
            </div>
          ) : visiblePhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon path={ICONS.search} className="h-6 w-6" style={{ color: '#CBD5E1' }} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>No photos match</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>Try a different keyword, date range, or folder.</p>
              <button onClick={function () { setSearchQuery(''); setFilterDateFrom(''); setFilterDateTo(''); }} style={{ fontSize: '13px', fontWeight: 700, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:underline focus:outline-none">Clear filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '14px' }} role="list" aria-label="Photo gallery">
              {visiblePhotos.map(function (photo) {
                var isHovered  = hoveredPhotoId === photo.id;
                var isDeleting = deletingPhotoId === photo.id;
                var isDragging = dragId === photo.id;
                var isDragOver = dragOverId === photo.id;
                return (
                  <div key={photo.id} role="listitem"
                    draggable={isAdmin}
                    onDragStart={function () { if (isAdmin) onDragStart(photo.id); }}
                    onDragEnter={function () { if (isAdmin) onDragEnter(photo.id); }}
                    onDragEnd={function () { if (isAdmin) onDragEnd(); }}
                    onDragOver={function (e) { e.preventDefault(); }}
                    onMouseEnter={function () { setHoveredPhotoId(photo.id); }}
                    onMouseLeave={function () { setHoveredPhotoId(null); }}
                    style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid ' + (isDragOver ? 'rgba(59,130,246,0.5)' : isHovered ? '#BFDBFE' : '#E2E8F0'), boxShadow: isDragOver ? '0 0 0 2px rgba(59,130,246,0.25)' : isHovered ? '0 4px 16px rgba(59,130,246,0.12)' : '3px 4px 14px rgba(0,0,0,0.06)', transition: 'border-color 0.15s,box-shadow 0.15s', opacity: isDragging ? 0.45 : 1, cursor: isAdmin ? 'grab' : 'default' }}
                  >
                    {photo.is_featured && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2, background: 'rgba(245,183,49,0.92)', borderRadius: '99px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Icon path={ICONS.star} className="h-3 w-3" style={{ color: '#0E1523' }} />
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#0E1523', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Featured</span>
                      </div>
                    )}
                    <button onClick={function () { setLightboxPhoto(photo); }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : '')}>
                      <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', opacity: isDeleting ? 0.4 : 1 }} loading="lazy" />
                      {isHovered && !isDeleting && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <Icon path={ICONS.expand} className="h-6 w-6" style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} strokeWidth={1.5} />
                        </div>
                      )}
                    </button>
                    {(photo.caption || photo.taken_at || photo.location) && (
                      <div style={{ padding: '8px 10px', background: '#FFFFFF' }}>
                        {photo.caption && <p style={{ fontSize: '12px', fontWeight: 600, color: '#0E1523', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 3px' }}>{photo.caption}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {photo.taken_at && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#94A3B8' }}><Icon path={ICONS.calendar} className="h-3 w-3" />{formatDate(photo.taken_at)}</span>}
                          {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}><Icon path={ICONS.location} className="h-3 w-3" style={{ flexShrink: 0 }} />{photo.location}</span>}
                        </div>
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', opacity: isHovered && !isDeleting ? 1 : 0, pointerEvents: isHovered && !isDeleting ? 'auto' : 'none', transition: 'opacity 0.15s' }}>
                        <button onClick={function (e) { e.stopPropagation(); setEditingPhoto(photo); }} style={{ width: '28px', height: '28px', background: '#FFFFFF', color: '#475569', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} className="hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={'Edit photo' + (photo.caption ? ': ' + photo.caption : '')} tabIndex={isHovered ? 0 : -1}>
                          <Icon path={ICONS.pencil} className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={function (e) { e.stopPropagation(); handleDeletePhoto(photo); }} disabled={isDeleting} style={{ width: '28px', height: '28px', background: '#EF4444', color: '#FFFFFF', borderRadius: '50%', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} className="focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Delete photo' + (photo.caption ? ': ' + photo.caption : '')} tabIndex={isHovered ? 0 : -1}>
                          <Icon path={ICONS.trash} className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          folders={folders}
          defaultFolderId={activeFolderId}
          organizationId={organizationId}
          currentUserId={currentUserId}
          organizationName={organizationName}
          onClose={function () { setShowUploadModal(false); }}
          onUploaded={fetchPhotos}
        />
      )}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={visiblePhotos}
          onClose={function () { setLightboxPhoto(null); }}
          onNavigate={function (dir) { var idx = visiblePhotos.findIndex(function (p) { return p.id === lightboxPhoto.id; }); var next = visiblePhotos[idx + dir]; if (next) setLightboxPhoto(next); }}
        />
      )}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          folders={folders}
          onClose={function () { setEditingPhoto(null); }}
          onSave={handleEditSave}
        />
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm || function () {}}
        onCancel={closeConfirm}
      />
    </main>
  );
}

export default OrgPhotoGallery;