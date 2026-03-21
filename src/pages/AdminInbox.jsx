import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function IconInbox({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}

function IconMessage({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconUsers({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconHandshake({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l1.06 1.06L12 21.23l7.77-7.94 1.06-1.06a5.4 5.4 0 000-7.65z" />
    </svg>
  );
}

function IconMail({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconCircle({ size }) {
  return (
    <svg width={size || 8} height={size || 8} viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}

function IconChevronRight({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconCheck({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SkeletonList() {
  return (
    <div aria-label="Loading messages" aria-busy="true">
      {[1, 2, 3, 4].map(function(i) {
        return (
          <div key={i} style={{ padding: '16px', borderBottom: '1px solid #2A3550' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2A3550' }} />
              <div>
                <div style={{ width: '120px', height: '12px', background: '#2A3550', borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ width: '80px', height: '10px', background: '#1E2845', borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ width: '90%', height: '10px', background: '#1E2845', borderRadius: '4px' }} />
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1E2845', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#64748B' }}>
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '260px', lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  var mins = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7) return days + 'd ago';
  return d.toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminInbox({ organizationId: propOrgId }) {
  var { organizationId: paramOrgId } = useParams();
  var orgId = propOrgId || paramOrgId;

  var [activeTab, setActiveTab] = useState('inquiries');
  var [inquiries, setInquiries] = useState([]);
  var [loading, setLoading] = useState(true);
  var [selected, setSelected] = useState(null);
  var [markingRead, setMarkingRead] = useState(false);

  var unreadCount = inquiries.filter(function(i) { return !i.is_read; }).length;

  useEffect(function() {
    if (orgId) fetchInquiries();
  }, [orgId]);

  async function fetchInquiries() {
    setLoading(true);
    var { data, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load inquiries');
    } else {
      setInquiries(data || []);
      if (data && data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    }
    setLoading(false);
  }

  async function handleSelect(inquiry) {
    setSelected(inquiry);
    if (!inquiry.is_read) {
      var { error } = await supabase
        .from('contact_inquiries')
        .update({ is_read: true })
        .eq('id', inquiry.id);
      if (!error) {
        setInquiries(function(prev) {
          return prev.map(function(i) {
            return i.id === inquiry.id ? Object.assign({}, i, { is_read: true }) : i;
          });
        });
        setSelected(Object.assign({}, inquiry, { is_read: true }));
      }
    }
  }

  async function handleMarkUnread() {
    if (!selected) return;
    setMarkingRead(true);
    var { error } = await supabase
      .from('contact_inquiries')
      .update({ is_read: false })
      .eq('id', selected.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      setInquiries(function(prev) {
        return prev.map(function(i) {
          return i.id === selected.id ? Object.assign({}, i, { is_read: false }) : i;
        });
      });
      setSelected(Object.assign({}, selected, { is_read: false }));
      toast.success('Marked as unread');
    }
    setMarkingRead(false);
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm('Delete this inquiry? This cannot be undone.')) return;
    var { error } = await supabase
      .from('contact_inquiries')
      .delete()
      .eq('id', selected.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Inquiry deleted');
      var remaining = inquiries.filter(function(i) { return i.id !== selected.id; });
      setInquiries(remaining);
      setSelected(remaining.length > 0 ? remaining[0] : null);
    }
  }

  var tabs = [
    { key: 'inquiries', label: 'Inquiries', icon: <IconInbox size={15} />, count: unreadCount },
    { key: 'members', label: 'Member Messages', icon: <IconMessage size={15} />, count: 0 },
    { key: 'collab', label: 'Collaboration', icon: <IconHandshake size={15} />, count: 0 },
  ];

  return (
    <div style={{ background: '#0E1523', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* Page Header */}
      <div style={{ background: '#151B2D', borderBottom: '1px solid #2A3550', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#F5B731' }}>
            <IconInbox size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Inbox</h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              {unreadCount > 0 ? unreadCount + ' unread message' + (unreadCount > 1 ? 's' : '') : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: '#151B2D', borderBottom: '1px solid #2A3550', display: 'flex', padding: '0 24px' }} role="tablist" aria-label="Inbox sections">
        {tabs.map(function(tab) {
          var isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={'panel-' + tab.key}
              onClick={function() { setActiveTab(tab.key); setSelected(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 16px', border: 'none', background: 'transparent',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                color: isActive ? '#3B82F6' : '#64748B',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                marginBottom: '-1px', whiteSpace: 'nowrap',
                outline: 'none',
              }}
              className={'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: '#EF4444', color: '#FFFFFF',
                  fontSize: '10px', fontWeight: 700,
                  padding: '1px 6px', borderRadius: '99px',
                  minWidth: '18px', textAlign: 'center'
                }} aria-label={tab.count + ' unread'}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Two-Panel Layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 133px)' }}>

        {/* Left Panel — List */}
        <div
          role="tabpanel"
          id={'panel-' + activeTab}
          style={{
            width: '320px', flexShrink: 0,
            borderRight: '1px solid #2A3550',
            overflowY: 'auto', background: '#0E1523'
          }}
        >
          {activeTab === 'inquiries' && (
            <>
              {loading ? (
                <SkeletonList />
              ) : inquiries.length === 0 ? (
                <EmptyState
                  icon={<IconMail size={24} />}
                  title="No inquiries yet"
                  description="When someone submits your public Join Us form, their message will appear here."
                />
              ) : (
                <div role="list" aria-label="Contact inquiries">
                  {inquiries.map(function(inq) {
                    var isSelected = selected && selected.id === inq.id;
                    return (
                      <button
                        key={inq.id}
                        role="listitem"
                        onClick={function() { handleSelect(inq); }}
                        aria-label={'Inquiry from ' + inq.name + (inq.is_read ? '' : ', unread')}
                        style={{
                          width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                          padding: '14px 16px',
                          background: isSelected ? '#1A2035' : 'transparent',
                          borderBottom: '1px solid #2A3550',
                          borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                          display: 'block',
                        }}
                        className={'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          {/* Avatar */}
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                            background: '#1E2845', border: '1px solid #2A3550',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: '#94A3B8'
                          }}>
                            {getInitials(inq.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: inq.is_read ? 600 : 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {inq.name}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', flexShrink: 0, marginLeft: '8px' }}>
                                {formatTime(inq.created_at)}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {inq.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              {!inq.is_read && (
                                <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center' }}>
                                  <IconCircle size={7} />
                                </span>
                              )}
                              <span style={{ fontSize: '12px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {inq.message ? inq.message.substring(0, 60) + (inq.message.length > 60 ? '…' : '') : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <EmptyState
              icon={<IconUsers size={24} />}
              title="Member messaging coming soon"
              description="Direct messages between members will appear here once the chat feature is live."
            />
          )}

          {activeTab === 'collab' && (
            <EmptyState
              icon={<IconHandshake size={24} />}
              title="No collaboration threads yet"
              description="When another org reaches out from the Community Board, the conversation will appear here."
            />
          )}
        </div>

        {/* Right Panel — Detail */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#0E1523' }}>
          {activeTab === 'inquiries' && !selected && !loading && (
            <EmptyState
              icon={<IconInbox size={28} />}
              title="Select an inquiry"
              description="Choose a message from the list to read it here."
            />
          )}

          {activeTab === 'inquiries' && selected && (
            <div style={{ padding: '28px 32px', maxWidth: '680px' }}>

              {/* Thread Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#1E2845', border: '1px solid #2A3550',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: '#94A3B8'
                  }}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>{selected.name}</div>
                    <a
                      href={'mailto:' + selected.email}
                      style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none' }}
                    >
                      {selected.email}
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selected.is_read && (
                    <button
                      onClick={handleMarkUnread}
                      disabled={markingRead}
                      aria-label="Mark as unread"
                      style={{
                        padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        background: 'transparent', border: '1px solid #2A3550',
                        color: '#94A3B8', cursor: 'pointer'
                      }}
                      className={'hover:border-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}
                    >
                      Mark unread
                    </button>
                  )}
                  <a
                    href={'mailto:' + selected.email}
                    aria-label={'Reply to ' + selected.name + ' by email'}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      background: '#3B82F6', border: '1px solid #3B82F6',
                      color: '#FFFFFF', cursor: 'pointer', textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <IconMail size={13} />
                    Reply via Email
                  </a>
                  <button
                    onClick={handleDelete}
                    aria-label="Delete inquiry"
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      background: 'transparent', border: '1px solid #2A3550',
                      color: '#EF4444', cursor: 'pointer'
                    }}
                    className={'hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500'}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                  <span>Received:</span>
                  <span style={{ color: '#CBD5E1' }}>{new Date(selected.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selected.is_read ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#22C55E' }}>
                      <IconCheck size={12} />
                      Read
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6' }}>
                      <IconCircle size={7} />
                      Unread
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #2A3550', marginBottom: '24px' }} />

              {/* Message Bubble */}
              <div style={{
                background: '#1A2035', border: '1px solid #2A3550',
                borderRadius: '12px', padding: '20px 24px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px' }}>
                  Message
                </div>
                <p style={{ fontSize: '15px', color: '#CBD5E1', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selected.message}
                </p>
              </div>

              {/* Future reply thread goes here */}
              <div style={{ marginTop: '24px', padding: '16px', background: '#151B2D', borderRadius: '8px', border: '1px dashed #2A3550' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px' }}>
                  <IconMessage size={14} />
                  Reply threading coming with the chat feature — use the email button above to respond for now.
                </div>
              </div>

            </div>
          )}

          {(activeTab === 'members' || activeTab === 'collab') && (
            <EmptyState
              icon={<IconMessage size={28} />}
              title="Coming soon"
              description="This will be wired up as part of the chat feature in the next build session."
            />
          )}
        </div>

      </div>
    </div>
  );
}