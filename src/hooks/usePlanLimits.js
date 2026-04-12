import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_LIMITS } from '../lib/planLimits';

/**
 * usePlanLimits — returns the current org's plan limits and usage.
 *
 * Returns:
 *   loading         — bool
 *   plan            — 'starter' | 'growth' | 'pro'
 *   limits          — PLAN_LIMITS[plan] object
 *   usage           — { members, storage_bytes, pages, admins, editors, email_sends }
 *   isAllowed(key)  — bool (e.g. isAllowed('can_sell_tickets'))
 *   isAtLimit(key)  — bool (e.g. isAtLimit('members'))
 *   usagePercent(key) — 0–100 (e.g. usagePercent('members'))
 *   refresh         — function
 */
export default function usePlanLimits(organizationId) {
  var [loading, setLoading] = useState(true);
  var [plan, setPlan] = useState('starter');
  var [limits, setLimits] = useState(PLAN_LIMITS.starter);
  var [usage, setUsage] = useState({
    members: 0,
    storage_bytes: 0,
    pages: 0,
    admins: 0,
    editors: 0,
    email_sends: 0,
  });
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
        // 1. Get active subscription plan
        var { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .maybeSingle();

        var currentPlan = (sub && sub.plan) ? sub.plan.toLowerCase() : 'starter';
        if (!PLAN_LIMITS[currentPlan]) currentPlan = 'starter';
        var currentLimits = PLAN_LIMITS[currentPlan];

        // 2. Count active members
        var { count: memberCount } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        // 3. Count admins
        var { count: adminCount } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .eq('role', 'admin');

        // 4. Count editors
        var { count: editorCount } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .eq('role', 'editor');

        // 5. Get storage used
        var { data: orgData } = await supabase
          .from('organizations')
          .select('storage_used_bytes')
          .eq('id', organizationId)
          .single();

        var storageBytes = (orgData && orgData.storage_used_bytes) ? orgData.storage_used_bytes : 0;

        // 6. Count email sends this month
        var startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        var { count: emailCount } = await supabase
          .from('email_recipients')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', organizationId)
          .gte('created_at', startOfMonth.toISOString());

        if (!cancelled) {
          setPlan(currentPlan);
          setLimits(currentLimits);
          setUsage({
            members: memberCount || 0,
            storage_bytes: storageBytes,
            pages: 0, // page count not tracked yet — placeholder
            admins: adminCount || 0,
            editors: editorCount || 0,
            email_sends: emailCount || 0,
          });
        }
      } catch (err) {
        console.error('usePlanLimits error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return function() { cancelled = true; };
  }, [organizationId, tick]);

  function isAllowed(key) {
    if (limits[key] === undefined) return true;
    return !!limits[key];
  }

  function isAtLimit(key) {
    if (key === 'members') {
      if (limits.members === null) return false;
      return usage.members >= limits.members;
    }
    if (key === 'storage') {
      if (limits.storage_gb === null) return false;
      var limitBytes = limits.storage_gb * 1024 * 1024 * 1024;
      return usage.storage_bytes >= limitBytes;
    }
    if (key === 'admins') {
      if (limits.admin_limit === null) return false;
      return usage.admins >= limits.admin_limit;
    }
    if (key === 'editors') {
      if (limits.editor_limit === null) return false;
      return usage.editors >= limits.editor_limit;
    }
    if (key === 'email_sends') {
      if (limits.email_sends_per_month === null) return false;
      return usage.email_sends >= limits.email_sends_per_month;
    }
    return false;
  }

  function usagePercent(key) {
    if (key === 'members') {
      if (!limits.members) return 0;
      return Math.min(100, Math.round((usage.members / limits.members) * 100));
    }
    if (key === 'storage') {
      if (!limits.storage_gb) return 0;
      var limitBytes = limits.storage_gb * 1024 * 1024 * 1024;
      return Math.min(100, Math.round((usage.storage_bytes / limitBytes) * 100));
    }
    if (key === 'email_sends') {
      if (!limits.email_sends_per_month) return 0;
      return Math.min(100, Math.round((usage.email_sends / limits.email_sends_per_month) * 100));
    }
    return 0;
  }

  return { loading, plan, limits, usage, isAllowed, isAtLimit, usagePercent, refresh };
}