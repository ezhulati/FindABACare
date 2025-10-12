import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'title',
      'description',
      'date',
      'start_time',
      'end_time',
      'city_id',
      'venue_name',
      'venue_address',
      'submitter_name',
      'submitter_email'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.submitter_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate date is in the future
    const eventDate = new Date(data.date);
    if (eventDate < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Event date must be in the future' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find or create venue
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('id')
      .eq('city_id', data.city_id)
      .ilike('name', `%${data.venue_name}%`)
      .single();

    let venueId = existingVenue?.id;

    if (!venueId) {
      // Create new venue with pending status
      const slug = data.venue_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newVenue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: data.venue_name,
          address: data.venue_address,
          city_id: data.city_id,
          slug: `${slug}-${Date.now()}`,
          status: 'pending',
          type: 'other',
          meter: 'Moderate',
        })
        .select('id')
        .single();

      if (venueError || !newVenue) {
        console.error('Venue creation error:', venueError);
        return new Response(
          JSON.stringify({ error: 'Failed to create venue' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      venueId = newVenue.id;
    }

    // Create admin notes with submitter info
    const adminNotes = `Submitted by: ${data.submitter_name} (${data.submitter_email})${data.source_url ? `\nEvent URL: ${data.source_url}` : ''}`;

    // Insert event with pending approval
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        venue_id: venueId,
        city_id: data.city_id,
        event_type: 'community',
        source_url: data.source_url || null,
        source_name: 'Community Submission',
        status: 'draft',
        approval_status: 'pending',
        admin_notes: adminNotes,
      });

    if (eventError) {
      console.error('Event creation error:', eventError);
      return new Response(
        JSON.stringify({ error: 'Failed to create event' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to submitter

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event submitted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Submit event error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
