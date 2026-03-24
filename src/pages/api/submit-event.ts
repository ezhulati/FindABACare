import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { rateLimitMiddleware } from '../../lib/rateLimit';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST: APIRoute = async ({ request }) => {
  try {
    // CSRF protection: verify the request Origin header
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      import.meta.env.PUBLIC_SITE_URL || 'https://autism.place',
      'http://localhost:4321',
      'http://localhost:3000',
    ];
    if (origin && !allowedOrigins.some((allowed: string) => origin.startsWith(allowed))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 5 submissions per 10 minutes per IP
    const rateLimitResponse = await rateLimitMiddleware(request, 5, 600);
    if (rateLimitResponse) return rateLimitResponse;

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

    // Basic email format check (not exhaustive — full validation requires sending a confirmation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.submitter_email) || data.submitter_email.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate date is in the future.
    // Note: new Date() uses the server timezone (UTC on Vercel), which is
    // consistent across all serverless invocations. This means the comparison
    // is stable — a date like "2025-12-01" will be compared against UTC "now".
    const eventDate = new Date(data.date);
    if (eventDate < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Event date must be in the future' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate start_time is before end_time
    if (data.start_time >= data.end_time) {
      return new Response(
        JSON.stringify({ error: 'Start time must be before end time' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate events (same title, date, and city)
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .ilike('title', data.title.trim())
      .eq('date', data.date)
      .eq('city_id', data.city_id)
      .maybeSingle();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ error: 'A similar event already exists for this date and location' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find or create venue
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('id')
      .eq('city_id', data.city_id)
      .ilike('name', `%${data.venue_name.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`)
      .maybeSingle();

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
