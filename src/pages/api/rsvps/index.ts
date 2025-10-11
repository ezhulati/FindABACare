import type { APIRoute } from 'astro';
import { getServerClient } from '../../../lib/supabaseServer';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with the user's token
    const supabase = getServerClient(request);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, venue:venues(*)')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check event capacity
    const { count: currentRsvps, error: countError } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('status', 'confirmed');

    if (countError) {
      return new Response(JSON.stringify({ error: 'Failed to check capacity' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const capacity = event.capacity || 12;
    if ((currentRsvps || 0) >= capacity) {
      return new Response(JSON.stringify({ error: 'Event is at capacity' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has an RSVP
    const { data: existingRsvp, error: rsvpCheckError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event_id)
      .eq('profile_id', profile.id)
      .single();

    if (existingRsvp) {
      // Update existing RSVP
      const newStatus = existingRsvp.status === 'confirmed' ? 'cancelled' : 'confirmed';

      const { error: updateError } = await supabase
        .from('rsvps')
        .update({ status: newStatus })
        .eq('id', existingRsvp.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update RSVP' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          message: newStatus === 'confirmed' ? 'RSVP confirmed' : 'RSVP cancelled'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new RSVP
    const { data: newRsvp, error: createError } = await supabase
      .from('rsvps')
      .insert({
        event_id,
        profile_id: profile.id,
        status: 'confirmed',
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to create RSVP' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'confirmed',
        rsvp: newRsvp,
        message: 'RSVP confirmed'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('RSVP API error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
