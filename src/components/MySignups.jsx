import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * MySignups Component
 * Shows the current user's sign-ups across organizations
 * Can be filtered by organization on unified dashboard
 */
function MySignups({ organizationId = null, showFilter = false }) {
  const [signups, setSignups] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSignups();
    if (showFilter) {
      fetchOrganizations();
    }
  }, [organizationId, selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('memberships')
        .select('organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');

      if (data) {
        setOrganizations(data.map(m => m.organizations).filter(Boolean));
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const fetchSignups = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('signup_responses')
        .select(`
          id,
          quantity,
          created_at,
          signup_items (
            id,
            item_name,
            slot_type,
            max_slots,
            current_signups,
            signup_forms (
              id,
              title,
              organization_id,
              organizations (
                id,
                name
              )
            )
          )
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter by organization if needed
      let filteredData = data || [];
      
      if (organizationId) {
        filteredData = filteredData.filter(
          s => s.signup_items?.signup_forms?.organization_id === organizationId
        );
      } else if (selectedOrg !== 'all') {
        filteredData = filteredData.filter(
          s => s.signup_items?.signup_forms?.organization_id === selectedOrg
        );
      }

      setSignups(filteredData);
    } catch (err) {
      console.error('Error fetching signups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (formId, orgId) => {
    navigate(`/organizations/${orgId}/signup-forms`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 flex-shrink-0">
          <Package size={20} className="text-blue-600" aria-hidden="true" />
          My Sign-Ups
        </h3>
        {showFilter && organizations.length > 1 && (
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Signups List */}
      {signups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No sign-ups yet</p>
          <p className="text-xs mt-1">Sign up for volunteer spots or items to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signups.map((signup) => {
            const item = signup.signup_items;
            const form = item?.signup_forms;
            const org = form?.organizations;
            const isSpots = item?.slot_type === 'spots';

            return (
              <div
                key={signup.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => handleViewForm(form?.id, org?.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{item?.item_name}</h4>
                      {signup.quantity > 1 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {signup.quantity} {isSpots ? (signup.quantity === 1 ? 'spot' : 'spots') : 'items'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{form?.title}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {showFilter && org && (
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {org.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Signed up {formatDate(signup.created_at)}
                      </span>
                      <span>
                        {item?.current_signups} of {item?.max_slots} {isSpots ? (item?.max_slots === 1 ? 'spot' : 'spots') : 'items'} filled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {signups.length > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-600">
            {signups.length} active sign-up{signups.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default MySignups;