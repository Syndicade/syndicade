// src/lib/eventService.js
import { supabase } from './supabase';

// ================================================================
// EVENT CRUD OPERATIONS
// ================================================================

export async function createEvent(eventData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const eventWithCreator = {
      ...eventData,
      created_by: user.id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .insert([eventWithCreator])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error creating event:', error);
    return { data: null, error: error.message };
  }
}

export async function getOrganizationEvents(organizationId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching organization events:', error);
    return { data: null, error: error.message };
  }
}

export async function getUserEvents() {
  try {
    const { data: memberships, error: memberError } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('status', 'active');

    if (memberError) throw memberError;

    const orgIds = memberships.map(m => m.organization_id);

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organization:organizations(name, type)
      `)
      .in('organization_id', orgIds)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching user events:', error);
    return { data: null, error: error.message };
  }
}

export async function getEventsInRange(startDate, endDate, organizationId = null) {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        organization:organizations(name, type)
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching events in range:', error);
    return { data: null, error: error.message };
  }
}

export async function getEventById(eventId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          type
        ),
        creator:members!created_by(
          user_id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching event:', error);
    return { data: null, error: error.message };
  }
}

export async function updateEvent(eventId, updates) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error updating event:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return { data: true, error: null };

  } catch (error) {
    console.error('Error deleting event:', error);
    return { data: null, error: error.message };
  }
}

// ================================================================
// RSVP OPERATIONS
// ================================================================

export async function upsertRSVP(eventId, status, guestCount = 0) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', user.id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('event_rsvps')
        .update({ 
          status, 
          guest_count: guestCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };

    } else {
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert([{
          event_id: eventId,
          member_id: user.id,
          status,
          guest_count: guestCount,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }

  } catch (error) {
    console.error('Error upserting RSVP:', error);
    return { data: null, error: error.message };
  }
}

export async function getEventRSVPs(eventId) {
  try {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        member:members(
          user_id,
          first_name,
          last_name,
          email,
          profile_photo_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return { data: null, error: error.message };
  }
}

export async function getUserRSVP(eventId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('member_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return { data: data || null, error: null };

  } catch (error) {
    console.error('Error fetching user RSVP:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteRSVP(eventId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('member_id', user.id);

    if (error) throw error;
    return { data: true, error: null };

  } catch (error) {
    console.error('Error deleting RSVP:', error);
    return { data: null, error: error.message };
  }
}

export async function getRSVPCounts(eventId) {
  try {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('status, guest_count')
      .eq('event_id', eventId);

    if (error) throw error;

    const counts = {
      going: 0,
      maybe: 0,
      not_going: 0,
      total_attendees: 0
    };

    data.forEach(rsvp => {
      counts[rsvp.status]++;
      if (rsvp.status === 'going') {
        counts.total_attendees += 1 + (rsvp.guest_count || 0);
      }
    });

    return { data: counts, error: null };

  } catch (error) {
    console.error('Error getting RSVP counts:', error);
    return { data: null, error: error.message };
  }
}

export async function getPublicEvents(filters = {}) {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          type
        )
      `)
      .eq('is_public', true)
      .gte('start_time', new Date().toISOString());

    if (filters.type) {
      query = query.eq('organization.type', filters.type);
    }

    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('start_time', filters.endDate.toISOString());
    }

    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching public events:', error);
    return { data: null, error: error.message };
  }
}

export async function canEditEvent(eventId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: event } = await supabase
      .from('events')
      .select('organization_id, created_by')
      .eq('id', eventId)
      .single();

    if (!event) return false;

    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('organization_id', event.organization_id)
      .eq('member_id', user.id)
      .single();

    return membership?.role === 'admin' || event.created_by === user.id;

  } catch (error) {
    console.error('Error checking edit permission:', error);
    return false;
  }
}

export async function isEventFull(eventId, maxAttendees) {
  if (!maxAttendees) return false;

  try {
    const { data: counts } = await getRSVPCounts(eventId);
    return counts.total_attendees >= maxAttendees;

  } catch (error) {
    console.error('Error checking if event is full:', error);
    return false;
  }
}