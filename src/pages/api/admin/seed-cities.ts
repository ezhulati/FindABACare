import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to seed cities into the database
 * POST /api/admin/seed-cities
 */
export const POST: APIRoute = async ({ request }) => {
  // Use service role key for admin operations
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Service role key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Insert cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .upsert(
        [
          {
            name: 'Dallas',
            state: 'TX',
            slug: 'dallas',
            center_lat: 32.7767,
            center_lng: -96.7970,
            status: 'active',
          },
          {
            name: 'Houston',
            state: 'TX',
            slug: 'houston',
            center_lat: 29.7604,
            center_lng: -95.3698,
            status: 'active',
          },
        ],
        { onConflict: 'slug' }
      )
      .select();

    if (citiesError) {
      return new Response(
        JSON.stringify({ error: citiesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cities seeded successfully',
        cities,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
