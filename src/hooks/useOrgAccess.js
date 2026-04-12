import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useOrgAccess(organizationId) {
  var [loading, setLoading] = useState(true);
  var [status, setStatus] = useState('active');
  var [daysLeft, setDaysLeft] = useState(null);
  var [trialEndsAt, setTrialEndsAt] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [org, setOrg] = useState(null);
  var [tick, setTick] = useState(0);

  function refresh() {
    setTick(function(t) { return t + 1; });
  }

  useEffect(function() {
    if (!organizationId) { setLoading(false); return; }

    var cancelled = false;

    async function load() {
      setLoading(true);
      try {
        var { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        var { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('id, name, account_status, trial_started_at, trial_length_days')
          .eq('id', organizationId)
          .single();

        if (orgErr || !orgData || cancelled) return;
        setOrg(orgData);

        var { data: membership } = await supabase
          .from('memberships')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('member_id', user.id)
          .eq('status', 'active')
          .single();

        if (!cancelled) {
          setIsAdmin(membership && membership.role === 'admin');
        }

        var { data: sub } = await supabase
          .from('subscriptions')
          .select('status, plan')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .maybeSingle();

        if (!cancelled) {
          if (sub) {
            setStatus('subscribed');
            setDaysLeft(null);
            setTrialEndsAt(null);
            setLoading(false);
            return;
          }
        }

        var trialStarted = orgData.trial_started_at ? new Date(orgData.trial_started_at) : null;
        var trialDays = orgData.trial_length_days || 14;

        if (!trialStarted) {
          if (!cancelled) {
            setStatus('active');
            setDaysLeft(null);
            setTrialEndsAt(null);
          }
        } else {
          var now = new Date();
          var trialEnd = new Date(trialStarted.getTime() + trialDays * 24 * 60 * 60 * 1000);
          var msLeft = trialEnd - now;
          var daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          var daysPastExpiry = Math.floor((now - trialEnd) / (1000 * 60 * 60 * 24));

          if (!cancelled) {
            setTrialEndsAt(trialEnd);

            if (daysRemaining > 0) {
              setStatus('trialing');
              setDaysLeft(daysRemaining);
            } else if (daysPastExpiry <= 30) {
              setStatus('expired');
              setDaysLeft(daysRemaining);
            } else {
              setStatus('iced');
              setDaysLeft(null);
            }
          }
        }
      } catch (err) {
        console.error('useOrgAccess error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return function() { cancelled = true; };
  }, [organizationId, tick]);

  return { loading, status, daysLeft, trialEndsAt, isAdmin, org, refresh };
}
