import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function MySignups({ organizationId, showFilter, headingId }) {
  var { isDark } = useTheme();
  var [signups, setSignups] = useState([]);
  var [organizations, setOrganizations] = useState([]);
  var [selectedOrg, setSelectedOrg] = useState('all');
  var [loading, setLoading] = useState(true);
  var navigate = useNavigate();

  // Color tokens
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted = isDark ? '#94A3B8' : '#64748B';
  var itemBg = isDark ? '#0E1523' : '#F8FAFC';
  var itemBorderHover = '#3B82F6';
  var inputBg = isDark ? '#1E2845' : '#FFFFFF';
  var inputBorder = isDark ? '#2A3550' : '#CBD5E1';

  useEffect(function() {
    fetchSignups();
    if (showFilter) fetchOrganizations();
  }, [organizationId, selectedOrg]);

  var fetchOrganizations = async function() {
    try {
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      var { data } = await supabase
        .from('memberships')
        .select('organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');
      if (data) setOrganizations(data.map(function(m) { return m.organizations; }).filter(Boolean));
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  var fetchSignups = async function() {
    try {
      setLoading(true);
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      var { data, error } = await supabase
        .from('signup_responses')
        .select('id, quantity, created_at, signup_items(id, item_name, slot_type, max_slots, current_signups, signup_forms(id, title, organization_id, organizations(id, name)))')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      var filtered = data || [];
      if (organizationId) {
        filtered = filtered.filter(function(s) { return s.signup_items?.signup_forms?.organization_id === organizationId; });
      } else if (selectedOrg !== 'all') {
        filtered = filtered.filter(function(s) { return s.signup_items?.signup_forms?.organization_id === selectedOrg; });
      }
      setSignups(filtered);
    } catch (err) {
      console.error('Error fetching signups:', err);
    } finally {
      setLoading(false);
    }
  };

  var formatDate = function(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3].map(function(i) {
          return (
            <div key={i} style={{ height: '64px', borderRadius: '8px', background: isDark ? '#0E1523' : '#F1F5F9' }} className="animate-pulse" />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Org filter — only shown when showFilter=true */}
      {showFilter && organizations.length > 1 && (
        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="signups-org-filter" style={{ fontSize: '11px', fontWeight: 700, color: textMuted, display: 'block', marginBottom: '4px' }}>
            Filter by org
          </label>
          <select
            id="signups-org-filter"
            value={selectedOrg}
            onChange={function(e) { setSelectedOrg(e.target.value); }}
            style={{ width: '100%', padding: '7px 10px', background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px', color: textPrimary, fontSize: '13px', cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Organizations</option>
            {organizations.map(function(org) {
              return <option key={org.id} value={org.id}>{org.name}</option>;
            })}
          </select>
        </div>
      )}

      {/* Empty state */}
      {signups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 16px' }}>
          <Package size={36} style={{ color: textMuted, margin: '0 auto 10px', opacity: 0.5 }} aria-hidden="true" />
          <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>No sign-ups yet</p>
          <p style={{ fontSize: '12px', color: textMuted, lineHeight: 1.5 }}>Sign up for volunteer spots or items to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {signups.map(function(signup) {
            var item = signup.signup_items;
            var form = item?.signup_forms;
            var org = form?.organizations;
            var isSpots = item?.slot_type === 'spots';

            return (
              <button
                key={signup.id}
                onClick={function() { if (org?.id) navigate('/organizations/' + org.id + '/signup-forms'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: itemBg, border: '1px solid ' + border, borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                aria-label={'View sign-up: ' + (item?.item_name || 'item') + ' in ' + (form?.title || 'form')}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item?.item_name}
                      </span>
                      {signup.quantity > 1 && (
                        <span style={{ padding: '1px 6px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontSize: '11px', fontWeight: 600, borderRadius: '99px', flexShrink: 0 }}>
                          &times;{signup.quantity} {isSpots ? 'spots' : 'items'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: textSecondary, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {form?.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {showFilter && org && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textMuted }}>
                          <Users size={11} aria-hidden="true" />{org.name}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textMuted }}>
                        <Calendar size={11} aria-hidden="true" />
                        {formatDate(signup.created_at)}
                      </span>
                      <span style={{ fontSize: '11px', color: textMuted }}>
                        {item?.current_signups}/{item?.max_slots} {isSpots ? 'spots' : 'items'} filled
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {signups.length > 0 && (
        <p style={{ fontSize: '12px', color: textMuted, textAlign: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid ' + border }}>
          {signups.length} active sign-up{signups.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default MySignups;