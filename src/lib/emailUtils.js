import { supabase } from './supabase';

export var MONTHLY_EMAIL_LIMIT = 500;

export function getMonthStart() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getEmailUsage(organizationId) {
  if (!organizationId) return { used: 0, limit: MONTHLY_EMAIL_LIMIT, percent: 0, isWarning: false, isBlocked: false };

  var monthStart = getMonthStart();

  var { count, error } = await supabase
    .from('email_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', organizationId)
    .gte('created_at', monthStart);

  if (error) {
    console.error('getEmailUsage error:', error);
    return { used: 0, limit: MONTHLY_EMAIL_LIMIT, percent: 0, isWarning: false, isBlocked: false };
  }

  var used = count || 0;
  var percent = Math.min(Math.round((used / MONTHLY_EMAIL_LIMIT) * 100), 100);

  return {
    used: used,
    limit: MONTHLY_EMAIL_LIMIT,
    percent: percent,
    isWarning: percent >= 80,
    isBlocked: used >= MONTHLY_EMAIL_LIMIT
  };
}