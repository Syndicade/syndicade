import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';
import { supabase } from '../lib/supabase';

// Status badge component
function VerificationStatusBadge({ status }) {
  var configs = {
    pending: {
      bg: 'rgba(245,183,49,0.12)',
      border: 'rgba(245,183,49,0.35)',
      color: '#F5B731',
      label: 'Under Review'
    },
    approved: {
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.35)',
      color: '#22C55E',
      label: 'Verified Nonprofit'
    },
    rejected: {
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.35)',
      color: '#EF4444',
      label: 'Not Approved'
    }
  };
  var c = configs[status] || configs.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '99px',
      background: c.bg, border: '1px solid ' + c.border, color: c.color,
      fontSize: '12px', fontWeight: 700
    }}>
      {status === 'approved' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {status === 'pending' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      )}
      {status === 'rejected' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
      {c.label}
    </span>
  );
}

export default function NonprofitVerificationForm({ organizationId, onSubmitted }) {
  var [loading, setLoading] = useState(true);
  var [submitting, setSubmitting] = useState(false);
  var [existing, setExisting] = useState(null);
  var [ein, setEin] = useState('');
  var [einError, setEinError] = useState('');
  var [file, setFile] = useState(null);
  var [fileName, setFileName] = useState('');
  var [dragOver, setDragOver] = useState(false);

  useEffect(function() {
    fetchExisting();
  }, [organizationId]);

  async function fetchExisting() {
    setLoading(true);
    var { data } = await supabase
      .from('nonprofit_verifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setExisting(data || null);
    setLoading(false);
  }

  function formatEin(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '-' + digits.slice(2, 9);
  }

  function handleEinChange(e) {
    var formatted = formatEin(e.target.value);
    setEin(formatted);
    setEinError('');
  }

  function handleFileChange(e) {
    var f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    var f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
      setFile(f);
      setFileName(f.name);
    } else {
      toast.error('Please upload a PDF or image file.');
    }
  }

  function validateEin(value) {
    var clean = value.replace(/\D/g, '');
    return clean.length === 9;
  }

  async function handleSubmit(e) {
  e.preventDefault();

    if (!ein && !file) {
      toast.error('Please provide an EIN or upload your IRS determination letter.');
      return;
    }
    if (ein && !validateEin(ein)) {
      setEinError('EIN must be 9 digits (format: XX-XXXXXXX)');
      return;
    }

    setSubmitting(true);
    var loadingToast = toast.loading('Submitting verification request...');

    try {
      var documentUrl = null;

      if (file) {
        var fileExt = fileName.split('.').pop();
        var filePath = organizationId + '/' + Date.now() + '.' + fileExt;
        var { error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        var { data: urlData } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(filePath);
        documentUrl = urlData.publicUrl;
      }

      var { error: insertError } = await supabase
        .from('nonprofit_verifications')
        .insert({
          organization_id: organizationId,
          ein: ein || null,
          document_url: documentUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.dismiss(loadingToast);
      mascotSuccessToast('Verification submitted!', 'We\'ll review your application within 48 hours.');
      await fetchExisting();
      if (onSubmitted) onSubmitted();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Skeleton
  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading verification status">
        <div style={{ height: '16px', background: '#1E2845', borderRadius: '4px', width: '40%', marginBottom: '12px' }} />
        <div style={{ height: '48px', background: '#1E2845', borderRadius: '8px', marginBottom: '12px' }} />
        <div style={{ height: '100px', background: '#1E2845', borderRadius: '8px' }} />
      </div>
    );
  }

  // Already submitted — show status
  if (existing) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: '#CBD5E1', fontWeight: 600 }}>Verification Status</p>
          <VerificationStatusBadge status={existing.status} />
        </div>

        {existing.status === 'pending' && (
          <div style={{ background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.2)', borderRadius: '8px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
              Your application was submitted on <strong>{new Date(existing.submitted_at).toLocaleDateString()}</strong>. We typically review within 48 hours.
            </p>
            {existing.ein && (
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', marginBottom: 0 }}>EIN on file: {existing.ein}</p>
            )}
            {existing.document_url && (
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>Determination letter uploaded.</p>
            )}
          </div>
        )}

        {existing.status === 'approved' && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
              Your organization is verified. Your events and org profile appear on the public discovery pages.
            </p>
          </div>
        )}

        {existing.status === 'rejected' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
              Your application was not approved.
              {existing.notes && ' Reason: ' + existing.notes}
            </p>
          </div>
        )}

        {existing.status === 'rejected' && (
          <button
            onClick={function() { setExisting(null); }}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ marginTop: '12px', fontSize: '13px' }}
          >
            Resubmit Application
          </button>
        )}
      </div>
    );
  }

  // Form
  return (
    <div>
      <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px', lineHeight: 1.6 }}>
        Verified 501(c)(3) organizations receive a 30-day free trial and access to the Community Board. Provide your EIN, upload your IRS determination letter, or bot.
      </p>

      {/* EIN field */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="np-ein"
          style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}
        >
          EIN (Employer Identification Number)
        </label>
        <input
          id="np-ein"
          type="text"
          value={ein}
          onChange={handleEinChange}
          placeholder="XX-XXXXXXX"
          maxLength={10}
          aria-describedby={einError ? 'ein-error' : undefined}
          aria-invalid={!!einError}
          style={{
            width: '100%', padding: '10px 14px',
            background: '#1E2845', border: '1px solid ' + (einError ? '#EF4444' : '#2A3550'),
            borderRadius: '8px', color: '#FFFFFF', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box'
          }}
          onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={function(e) { e.target.style.borderColor = einError ? '#EF4444' : '#2A3550'; }}
        />
        {einError && (
          <p id="ein-error" role="alert" style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{einError}</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '1px', background: '#2A3550' }} />
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#2A3550' }} />
      </div>

      {/* File upload */}
      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="np-doc"
          style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}
        >
          IRS Determination Letter
        </label>
        <div
          onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
          onDragLeave={function() { setDragOver(false); }}
          onDrop={handleDrop}
          onClick={function() { document.getElementById('np-doc').click(); }}
          role="button"
          tabIndex={0}
          aria-label="Upload IRS determination letter — PDF or image"
          onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') document.getElementById('np-doc').click(); }}
          style={{
            border: '2px dashed ' + (dragOver ? '#3B82F6' : (file ? '#22C55E' : '#2A3550')),
            borderRadius: '8px', padding: '24px',
            textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(59,130,246,0.05)' : (file ? 'rgba(34,197,94,0.05)' : 'transparent'),
            transition: 'all 0.15s'
          }}
        >
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 600 }}>{fileName}</span>
              <button
                type="button"
                onClick={function(e) { e.stopPropagation(); setFile(null); setFileName(''); }}
                aria-label="Remove file"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', marginLeft: '4px', padding: '2px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" style={{ margin: '0 auto 8px' }} aria-hidden="true">
                <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                Drop your PDF or image here, or <span style={{ color: '#3B82F6' }}>browse</span>
              </p>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>PDF, PNG, JPG up to 10MB</p>
            </>
          )}
        </div>
        <input
          id="np-doc"
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Upload IRS determination letter"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{ fontSize: '14px', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </div>
  );
}