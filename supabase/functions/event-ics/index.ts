import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var url = new URL(req.url)
    var eventId = url.searchParams.get('event_id')

    if (!eventId) {
      return new Response('Missing event_id', { status: 400 })
    }

    var supabaseUrl = Deno.env.get('SUPABASE_URL')
    var supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    var supabase = createClient(supabaseUrl, supabaseKey)

    var { data: event, error } = await supabase
      .from('events')
      .select('*, organizations(name)')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return new Response('Event not found', { status: 404 })
    }

    var start = new Date(event.start_time)
    var end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000)

    function formatICSDate(date) {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    function escapeICS(str) {
      if (!str) return ''
      return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
    }

    var orgName = (event.organizations && event.organizations.name) ? event.organizations.name : ''
    var location = event.is_virtual ? (event.virtual_link || 'Virtual Event') : (event.location || '')
    var description = event.description || ''
    if (orgName) description = 'Hosted by ' + orgName + (description ? '\\n\\n' + description : '')

    var uid = event.id + '@syndicade.com'

    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Syndicade//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + formatICSDate(new Date()),
      'DTSTART:' + formatICSDate(start),
      'DTEND:' + formatICSDate(end),
      'SUMMARY:' + escapeICS(event.title),
      'DESCRIPTION:' + escapeICS(description),
      'LOCATION:' + escapeICS(location),
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    var filename = event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.ics'

    return new Response(ics, {
      headers: Object.assign({}, corsHeaders, {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
      }),
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      status: 400,
    })
  }
})