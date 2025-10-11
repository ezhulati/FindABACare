import type { APIRoute } from 'astro';
import { getServerClient, getAuthUser } from '../../lib/supabaseServer';
import { RSVPCreate } from '../../lib/validation';
import { rateLimit } from '../../lib/rateLimit';
import { sendEmail } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  const supabase = getServerClient(request);

  try {
    // Check authentication
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `rsvp:${user.id}:${clientIP}`;
    const allowed = await rateLimit(rateLimitKey, 10, 3600); // 10 RSVPs per hour

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = RSVPCreate.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { event_id } = validation.data;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, venue:venues(*)')
      .eq('id', event_id)
      .eq('status', 'published')
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already RSVPed
    const { data: existingRSVP } = await supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', event_id)
      .eq('profile_id', user.id)
      .eq('status', 'confirmed')
      .single();

    if (existingRSVP) {
      return new Response(
        JSON.stringify({ error: 'You have already RSVPed to this event' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check capacity
    const { count: rsvpCount } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('status', 'confirmed');

    const capacity = event.capacity || 12;

    if ((rsvpCount || 0) >= capacity) {
      return new Response(
        JSON.stringify({ error: 'This event is full' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create RSVP
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .insert({
        event_id,
        profile_id: user.id,
        status: 'confirmed',
      })
      .select()
      .single();

    if (rsvpError) {
      return new Response(
        JSON.stringify({ error: rsvpError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        template: 'rsvp_confirmation',
        data: {
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.start_time,
          venueName: event.venue?.name || '',
          venueAddress: event.venue?.address || '',
        },
      });
    } catch (emailError) {
      // Log but don't fail the RSVP if email fails
      console.error('Failed to send confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        rsvp,
        message: 'RSVP confirmed! Check your email for details.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('RSVP error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Cancel RSVP
export const DELETE: APIRoute = async ({ request, url }) => {
  const supabase = getServerClient(request);

  try {
    // Check authentication
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rsvpId = url.searchParams.get('id');

    if (!rsvpId) {
      return new Response(
        JSON.stringify({ error: 'RSVP ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update RSVP status to cancelled
    const { error } = await supabase
      .from('rsvps')
      .update({ status: 'cancelled' })
      .eq('id', rsvpId)
      .eq('profile_id', user.id); // Ensure user owns this RSVP

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'RSVP cancelled' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Cancel RSVP error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
