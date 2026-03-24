import type { APIRoute } from 'astro';
import { getServerClient, getAuthUser } from '../../lib/supabaseServer';
import { ReviewCreate } from '../../lib/validation';
import { rateLimit, rateLimitMiddleware } from '../../lib/rateLimit';

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

    // Rate limiting - 5 reviews per day
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `review:${user.id}:${clientIP}`;
    const allowed = await rateLimit(rateLimitKey, 5, 86400);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again tomorrow.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ReviewCreate.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const reviewData = validation.data;

    // Check if venue exists
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', reviewData.venue_id)
      .eq('status', 'active')
      .single();

    if (venueError || !venue) {
      return new Response(
        JSON.stringify({ error: 'Venue not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already reviewed this venue
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('venue_id', reviewData.venue_id)
      .eq('profile_id', user.id)
      .single();

    if (existingReview) {
      return new Response(
        JSON.stringify({ error: 'You have already reviewed this venue' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create review (status = pending for moderation)
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        venue_id: reviewData.venue_id,
        profile_id: user.id,
        predictability: reviewData.predictability,
        sensory_level: reviewData.sensory_level,
        staff_knowledge: reviewData.staff_knowledge,
        content: reviewData.content,
        best_time: reviewData.best_time,
        triggers: reviewData.triggers || [],
        status: 'pending', // Requires moderation
      })
      .select()
      .single();

    if (reviewError) {
      return new Response(
        JSON.stringify({ error: reviewError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        review,
        message: 'Thank you for your review! It will be published after moderation.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Review creation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Get reviews for a venue
export const GET: APIRoute = async ({ request, url }) => {
  const rateLimitResponse = await rateLimitMiddleware(request, 120, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = getServerClient(request);

  try {
    const venueId = url.searchParams.get('venue_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!venueId) {
      return new Response(
        JSON.stringify({ error: 'Venue ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch published reviews
    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, profile:profiles(*)', { count: 'exact' })
      .eq('venue_id', venueId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate averages
    const avgRatings = data && data.length > 0 ? {
      predictability: (data.reduce((sum, r) => sum + (r.predictability || 0), 0) / data.length).toFixed(1),
      sensoryLevel: (data.reduce((sum, r) => sum + (r.sensory_level || 0), 0) / data.length).toFixed(1),
      staffKnowledge: (data.reduce((sum, r) => sum + (r.staff_knowledge || 0), 0) / data.length).toFixed(1),
    } : null;

    return new Response(
      JSON.stringify({
        reviews: data,
        averages: avgRatings,
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
    console.error('Fetch reviews error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
