import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  try {
    var supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    var now = new Date()
    var windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    var windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Get events starting in the next 24-25 hours
    var { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_time, location, organization_id, is_virtual')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .eq('visibility', 'members')

    if (eventsError) throw eventsError
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No events in window', count: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    var totalNotifications = 0

    for (var i = 0; i < events.length; i++) {
      var event = events[i]

      // Get all members who RSVPd going
      var { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('member_id')
        .eq('event_id', event.id)
        .eq('status', 'going')

      if (!rsvps || rsvps.length === 0) continue

      var memberIds = rsvps.map((r: any) => r.member_id)

      // Check preferences — fetch all pref rows for this org in one query
      var { data: prefs } = await supabase
        .from('member_notification_prefs')
        .select('user_id, muted, overrides')
        .eq('org_id', event.organization_id)
        .in('user_id', memberIds)

      var prefMap: Record<string, any> = {}
      if (prefs) {
        prefs.forEach((p: any) => { prefMap[p.user_id] = p })
      }

      // Filter out opted-out members
      var eligibleIds = memberIds.filter((userId: string) => {
        var pref = prefMap[userId]
        if (!pref) return true
        if (pref.muted === true) return false
        if (pref.overrides && pref.overrides['event_reminder'] === false) return false
        return true
      })

      if (eligibleIds.length === 0) continue

      // Format event time
      var eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      })

      var message = event.is_virtual
        ? event.title + ' starts tomorrow at ' + eventDate + '. Check your email for the virtual link.'
        : event.title + ' starts tomorrow at ' + eventDate + (event.location ? ' · ' + event.location : '') + '.'

      var notifications = eligibleIds.map((userId: string) => ({
        user_id: userId,
        organization_id: event.organization_id,
        type: 'event_reminder',
        title: 'Reminder: ' + event.title,
        message: message,
        link: '/events/' + event.id,
        read: false,
      }))

      var { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Insert error for event ' + event.id + ':', insertError)
        continue
      }

      totalNotifications += notifications.length
    }

    return new Response(
      JSON.stringify({ message: 'Done', events: events.length, notifications: totalNotifications }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('send-event-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})