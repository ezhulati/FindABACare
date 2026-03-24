/**
 * Venue Favorite API
 *
 * GET: Check if venue is favorited and get stats
 * POST: Toggle favorite status for a venue
 * DELETE: Remove favorite (alternative to POST toggle)
 */

import type { APIRoute } from 'astro';
import { getServerClient } from '@/lib/supabaseServer';

export const GET: APIRoute = async ({ request, url }) => {
  const supabase = getServerClient(request);
  const venueId = url.searchParams.get('venue_id');

  if (!venueId) {
    return new Response(JSON.stringify({ error: 'Missing venue_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({
      is_favorited: false,
      favorite_count: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user's profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if user has favorited this venue
  const { data: favorite } = await supabase
    .from('venue_favorites')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('venue_id', venueId)
    .maybeSingle();

  // Get venue favorite count
  const { data: venue } = await supabase
    .from('venues')
    .select('favorite_count')
    .eq('id', venueId)
    .single();

  return new Response(JSON.stringify({
    is_favorited: !!favorite,
    favorite_count: venue?.favorite_count || 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const supabase = getServerClient(request);

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid or malformed JSON in request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { venue_id } = body;

  if (!venue_id) {
    return new Response(JSON.stringify({ error: 'Missing venue_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user's profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from('venue_favorites')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('venue_id', venue_id)
    .maybeSingle();

  let isFavorited = false;

  if (existing) {
    // Remove favorite
    await supabase
      .from('venue_favorites')
      .delete()
      .eq('id', existing.id);

    isFavorited = false;
  } else {
    // Add favorite
    await supabase
      .from('venue_favorites')
      .insert({
        profile_id: profile.id,
        venue_id: venue_id
      });

    isFavorited = true;
  }

  // Get updated favorite count
  const { data: venue } = await supabase
    .from('venues')
    .select('favorite_count')
    .eq('id', venue_id)
    .single();

  return new Response(JSON.stringify({
    is_favorited: isFavorited,
    favorite_count: venue?.favorite_count || 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const supabase = getServerClient(request);

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const venueId = url.searchParams.get('venue_id');

  if (!venueId) {
    return new Response(JSON.stringify({ error: 'Missing venue_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user's profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Remove favorite
  await supabase
    .from('venue_favorites')
    .delete()
    .eq('profile_id', profile.id)
    .eq('venue_id', venueId);

  // Get updated favorite count
  const { data: venue } = await supabase
    .from('venues')
    .select('favorite_count')
    .eq('id', venueId)
    .single();

  return new Response(JSON.stringify({
    is_favorited: false,
    favorite_count: venue?.favorite_count || 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
