import type { APIRoute } from 'astro';
import { getServerClient } from '../../lib/supabaseServer';
import { rateLimitMiddleware } from '../../lib/rateLimit';
import dayjs from 'dayjs';

export const GET: APIRoute = async ({ request, url }) => {
  const rateLimitResponse = await rateLimitMiddleware(request, 120, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = getServerClient(request);

  // Parse query parameters
  const cityId = url.searchParams.get('city_id');
  const citySlug = url.searchParams.get('city');
  const venueId = url.searchParams.get('venue_id');
  const upcoming = url.searchParams.get('upcoming') !== 'false'; // Default to upcoming only
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        city:cities(*),
        rsvp_count:rsvps(count)
      `, { count: 'exact' })
      .eq('status', 'published');

    // Filter by city
    if (cityId) {
      query = query.eq('city_id', cityId);
    } else if (citySlug) {
      // First get city ID from slug
      const { data: city } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', citySlug)
        .single();

      if (city) {
        query = query.eq('city_id', city.id);
      }
    }

    // Filter by venue
    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    // Filter upcoming events only
    if (upcoming) {
      query = query.gte('date', dayjs().format('YYYY-MM-DD'));
    }

    // Apply pagination and ordering
    query = query
      .order('date')
      .order('start_time')
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process events to add RSVP counts
    const processedEvents = (data || []).map((event) => ({
      ...event,
      rsvpCount: event.rsvp_count?.[0]?.count || 0,
      spotsRemaining: (event.capacity || 12) - (event.rsvp_count?.[0]?.count || 0),
    }));

    return new Response(
      JSON.stringify({
        events: processedEvents,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute (more dynamic)
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
