/**
 * PostModal.jsx — Syndicade Community Board
 * Create / edit a post (all board types). Handles vendor contacts for recommendations.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../MascotToast';
import { VendorContactRow } from './RecommendationCard';
import {
  CARD, BDR, ELEV, TEXT, TEXT2, MUTED, BLUE, RED,
  IconX, IconPlus, IconClock
} from './cbUtils';

export default function PostModal(props) {
  var cfg = props.config, userOrgs = props.userOrgs, editingPost = props.editingPost;
  var approvedOrgIds = props.approvedOrgIds || [];
  var isEditing = !!editingPost;
  var isRec = props.boardType === 'recommendations';

  // Auto-select: first approved org, or single org if only one total
  var defaultOrgId = (function() {
    if (editingPost) return editingPost.org_id;
    var approved = userOrgs.filter(function(o) { return approvedOrgIds.indexOf(o.id) !== -1; });
    if (approved.length === 1) return approved[0].id;
    if (userOrgs.length === 1) return userOrgs[0].id;
    return '';
  })();
  var [orgId, setOrgId] = useState(defaultOrgId);
  var [category, setCategory] = useState(editingPost ? editingPost.category : cfg.categories[0]);
  var [title, setTitle] = useState(editingPost ? editingPost.title : '');
  var [body, setBody] = useState(editingPost ? editingPost.body : '');
  var [websiteUrl, setWebsiteUrl] = useState(editingPost ? editingPost.website_url || '' : '');
  var [contacts, setContacts] = useState([]);
  var [contactsLoading, setContactsLoading] = useState(false);
  var [saving, setSaving] = useState(false);

  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  useEffect(function() {
    if (isEditing && isRec && editingPost.id) {
      setContactsLoading(true);
      supabase.from('vendor_contacts').select('*').eq('post_id', editingPost.id).order('display_order', { ascending: true })
        .then(function(result) { setContacts(result.data || []); setContactsLoading(false); });
    }
  }, []);

  function addContact() { setContacts(function(prev) { return prev.concat([{ name: '', title: '', email: '', phone: '', _isNew: true }]); }); }
  function updateContact(idx, updated) { setContacts(function(prev) { return prev.map(function(c, i) { return i === idx ? updated : c; }); }); }
  function removeContact(idx) { setContacts(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); }); }

  async function saveContacts(postId) {
    var existing = contacts.filter(function(c) { return c.id; });
    var newOnes = contacts.filter(function(c) { return !c.id; });
    var existingIds = existing.map(function(c) { return c.id; });
    var { data: origContacts } = await supabase.from('vendor_contacts').select('id').eq('post_id', postId);
    var origIds = (origContacts || []).map(function(c) { return c.id; });
    var toDelete = origIds.filter(function(id) { return existingIds.indexOf(id) === -1; });
    if (toDelete.length > 0) await supabase.from('vendor_contacts').delete().in('id', toDelete);
    for (var i = 0; i < existing.length; i++) {
      var c = existing[i];
      await supabase.from('vendor_contacts').update({ name: c.name, title: c.title || null, email: c.email || null, phone: c.phone || null, display_order: i }).eq('id', c.id);
    }
    if (newOnes.length > 0) {
      var rows = newOnes.map(function(c, ni) {
        return { post_id: postId, name: c.name, title: c.title || null, email: c.email || null, phone: c.phone || null, display_order: existing.length + ni };
      });
      await supabase.from('vendor_contacts').insert(rows);
    }
  }

  async function handleSubmit() {
    if (!orgId) { toast.error('Select which org is posting.'); return; }
    if (!title.trim()) { toast.error(isRec ? 'Add a vendor name.' : 'Add a headline.'); return; }
    if (!body.trim()) { toast.error('Add some details.'); return; }
    if (isRec) {
      var invalidContact = contacts.find(function(c) { return !c.name || !c.name.trim(); });
      if (invalidContact) { toast.error('Each contact needs a name.'); return; }
    }
    setSaving(true);
    try {
      if (isEditing) {
        var updateData = { category: category, title: title.trim(), body: body.trim() };
        if (isRec) updateData.website_url = websiteUrl.trim() || null;
        var { error } = await supabase.from('community_board_posts').update(updateData).eq('id', editingPost.id);
        if (error) throw error;
        if (isRec) await saveContacts(editingPost.id);
        mascotSuccessToast('Post updated.');
      } else {
        var { data: authData } = await supabase.auth.getUser();
        var now = new Date();
        var expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
        var insertData = {
          board_id: props.boardId, board_type: props.boardType, category: category,
          title: title.trim(), body: body.trim(), org_id: orgId,
          created_by: authData.user.id, status: 'open', is_active: true,
          response_count: 0, expires_at: expiresAt, last_activity_at: now.toISOString()
        };
        if (isRec) insertData.website_url = websiteUrl.trim() || null;
        var { data: newPost, error: ie } = await supabase.from('community_board_posts').insert(insertData).select().single();
        if (ie) throw ie;
        if (isRec && contacts.length > 0 && newPost) await saveContacts(newPost.id);
        mascotSuccessToast('Post published to the board.');
      }
      props.onSuccess(); props.onClose();
    } catch (err) {
      mascotErrorToast('Could not save post.', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={(isEditing ? 'Edit post' : 'Post to ') + cfg.label}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>{isEditing ? 'Edit Post' : cfg.buttonLabel}</h2>
          <button onClick={props.onClose} aria-label="Close"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2 }}>
            <IconX size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isEditing && userOrgs.length > 1 && (
            <div>
              <label htmlFor="pm-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Posting as</label>
              <select id="pm-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(o) {
                  var isMember = approvedOrgIds.indexOf(o.id) !== -1;
                  return <option key={o.id} value={o.id} disabled={!isMember}>{o.name + (!isMember ? ' (not on this board)' : '')}</option>;
                })}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="pm-cat" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Category</label>
            <select id="pm-cat" value={category} onChange={function(e) { setCategory(e.target.value); }} style={inputStyle}>
              {cfg.categories.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>

          <div>
            <label htmlFor="pm-title" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>{isRec ? 'Vendor / Provider Name' : 'Headline'}</label>
            <input id="pm-title" type="text" value={title} onChange={function(e) { setTitle(e.target.value); }}
              maxLength={120} placeholder={isRec ? 'e.g. Toledo Print Solutions' : 'e.g. Looking for a printing vendor under $500'} style={inputStyle} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{title.length + '/120'}</p>
          </div>

          {isRec && (
            <div>
              <label htmlFor="pm-website" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>
                Website <span style={{ fontWeight: 400, color: MUTED, fontSize: '11px' }}>(optional)</span>
              </label>
              <input id="pm-website" type="url" value={websiteUrl} onChange={function(e) { setWebsiteUrl(e.target.value); }}
                maxLength={300} placeholder="https://vendor.com" style={inputStyle} />
            </div>
          )}

          <div>
            <label htmlFor="pm-body" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>{isRec ? 'Why you recommend them' : 'Details'}</label>
            <textarea id="pm-body" value={body} onChange={function(e) { setBody(e.target.value); }}
              rows={4} maxLength={500}
              placeholder={isRec ? 'Describe your experience, pricing range...' : 'Provide context — timeline, quantities...'}
              style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{body.length + '/500'}</p>
          </div>

          {isRec && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: TEXT2 }}>
                  Contacts <span style={{ fontWeight: 400, color: MUTED, fontSize: '11px' }}>(optional)</span>
                </label>
                <button onClick={addContact}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: ELEV, border: '1px solid ' + BDR, color: TEXT2, cursor: 'pointer' }}>
                  <IconPlus size={11} />Add Contact
                </button>
              </div>
              {contactsLoading
                ? <div aria-busy="true" style={{ height: '60px', background: ELEV, borderRadius: '10px' }} />
                : contacts.length === 0
                  ? <div style={{ padding: '16px', background: ELEV, borderRadius: '10px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>No contacts added yet.</p></div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {contacts.map(function(c, i) { return <VendorContactRow key={c.id || 'new-' + i} contact={c} index={i} onChange={updateContact} onRemove={removeContact} />; })}
                  </div>
              }
            </div>
          )}

          {!isEditing && (
            <p style={{ fontSize: '11px', color: MUTED, margin: '-8px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <IconClock size={11} />Posts expire after 60 days. You can renew anytime.
            </p>
          )}

          <button onClick={handleSubmit} disabled={saving}
            style={{ padding: '12px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish to Board')}
          </button>
        </div>
      </div>
    </div>
  );
}