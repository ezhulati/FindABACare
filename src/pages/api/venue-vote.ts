/**
 * Venue Voting API
 *
 * POST /api/venue-vote - Create or update a vote
 * DELETE /api/venue-vote - Remove a vote
 * GET /api/venue-vote?venue_id=xxx - Get user's vote for a venue
 */

import type { APIRoute } from 'astro';
import { getServerClient, getAuthUser } from '@/lib/supabaseServer';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getServerClient(request);

    // Require authentication
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { venue_id, vote_type } = await request.json();

    // Validate input
    if (!venue_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (vote_type !== 'up' && vote_type !== 'down') {
      return new Response(
        JSON.stringify({ error: 'vote_type must be "up" or "down"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('venue_votes')
      .select('id, vote_type')
      .eq('venue_id', venue_id)
      .eq('profile_id', user.id)
      .single();

    let result;

    if (existingVote) {
      // If same vote type, treat as "unvote" (delete)
      if (existingVote.vote_type === vote_type) {
        const { error } = await supabase
          .from('venue_votes')
          .delete()
          .eq('id', existingVote.id);

        if (error) throw error;

        result = { action: 'removed', vote_type: null };
      } else {
        // Update to opposite vote
        const { error } = await supabase
          .from('venue_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        if (error) throw error;

        result = { action: 'updated', vote_type };
      }
    } else {
      // Create new vote
      const { error } = await supabase
        .from('venue_votes')
        .insert({
          venue_id,
          profile_id: user.id,
          vote_type,
        });

      if (error) throw error;

      result = { action: 'created', vote_type };
    }

    // Get updated vote counts
    const { data: venue } = await supabase
      .from('venues')
      .select('upvotes, downvotes, vote_score')
      .eq('id', venue_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        venue_stats: venue,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Venue vote error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const supabase = getServerClient(request);

    // Require authentication
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const venue_id = url.searchParams.get('venue_id');

    if (!venue_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete vote
    const { error } = await supabase
      .from('venue_votes')
      .delete()
      .eq('venue_id', venue_id)
      .eq('profile_id', user.id);

    if (error) throw error;

    // Get updated vote counts
    const { data: venue } = await supabase
      .from('venues')
      .select('upvotes, downvotes, vote_score')
      .eq('id', venue_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        action: 'removed',
        venue_stats: venue,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Venue unvote error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabase = getServerClient(request);

    // Get user (optional - can check votes without auth)
    const user = await getAuthUser(request);

    const venue_id = url.searchParams.get('venue_id');

    if (!venue_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userVote = null;

    if (user) {
      // Get user's vote for this venue
      const { data } = await supabase
        .from('venue_votes')
        .select('vote_type')
        .eq('venue_id', venue_id)
        .eq('profile_id', user.id)
        .single();

      userVote = data?.vote_type || null;
    }

    // Get venue vote stats
    const { data: venue } = await supabase
      .from('venues')
      .select('upvotes, downvotes, vote_score')
      .eq('id', venue_id)
      .single();

    return new Response(
      JSON.stringify({
        venue_id,
        user_vote: userVote,
        venue_stats: venue || { upvotes: 0, downvotes: 0, vote_score: 0 },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Get venue vote error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
