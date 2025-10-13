/**
 * Profile API Endpoint
 * Handles GET and PUT requests for user profiles
 */

import type { APIRoute } from 'astro';
import { getServerClient } from '../../lib/supabaseServer';

export const GET: APIRoute = async ({ request }) => {
  const supabase = getServerClient(request);

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, city:cities(id, name, state)')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const supabase = getServerClient(request);

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const {
    first_name,
    last_name,
    avatar_url,
    city_id,
    child_age_band,
    interests,
    sensory_flags
  } = body;

  // Validate required fields
  if (!first_name || !last_name) {
    return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate display name (FirstName L.)
  const display_name = `${first_name.trim()} ${last_name.trim().charAt(0)}.`;

  // Build update object
  const updateData: any = {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    display_name,
    city_id: city_id || null,
    child_age_band: child_age_band || null,
    interests: interests || null,
    sensory_flags: sensory_flags || {},
    profile_completed: true,
    updated_at: new Date().toISOString()
  };

  // Only update avatar if provided
  if (avatar_url) {
    updateData.avatar_url = avatar_url;
  }

  // Update profile
  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Profile update error:', updateError);
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
