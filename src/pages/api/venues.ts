import type { APIRoute } from 'astro';
import { getServerClient } from '../../lib/supabaseServer';
import { goNow } from '../../lib/goNow';
import { rateLimitMiddleware } from '../../lib/rateLimit';

export const GET: APIRoute = async ({ request, url }) => {
  const rateLimitResponse = await rateLimitMiddleware(request, 120, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = getServerClient(request);

  // Parse query parameters
  const cityId = url.searchParams.get('city_id');
  const citySlug = url.searchParams.get('city');
  const hasQuietRoom = url.searchParams.get('amenities.quiet_room');
  const hasNoHandDryer = url.searchParams.get('amenities.hand_dryer');
  const hasSensoryHours = url.searchParams.get('has_sensory_hours');
  const hasVisualSupports = url.searchParams.get('amenities.visual_supports');
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Build query
    let query = supabase
      .from('venues')
      .select('*, city:cities(*)', { count: 'exact' })
      .eq('status', 'active');

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

    // Full-text search by venue name, type, or address
    if (search) {
      const escaped = search.replace(/[%_]/g, '\\$&');
      query = query.or(`name.ilike.%${escaped}%,type.ilike.%${escaped}%,address.ilike.%${escaped}%`);
    }

    // Filter by type
    if (type) {
      query = query.eq('type', type);
    }

    // Amenities filters - using JSONB operators
    if (hasQuietRoom === 'true') {
      query = query.eq('amenities->>quiet_room', 'true');
    }

    if (hasNoHandDryer === 'false') {
      query = query.eq('amenities->>hand_dryer', 'false');
    }

    if (hasVisualSupports === 'true') {
      query = query.eq('amenities->>visual_supports', 'true');
    }

    // Sensory hours filter
    if (hasSensoryHours === 'true') {
      query = query.not('sensory_hours', 'is', null);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('name');

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

    // Add Go Now meter to each venue
    const venuesWithMeter = (data || []).map((venue) => ({
      ...venue,
      meter: venue.meter || goNow(venue.type ?? undefined),
    }));

    return new Response(
      JSON.stringify({
        venues: venuesWithMeter,
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
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
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
