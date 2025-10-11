import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to seed venues from Google Places
 * POST /api/admin/seed-venues
 * Body: { citySlug: 'dallas' | 'houston' }
 */

interface GooglePlace {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
}

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleApiKey = import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Service role key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!googleApiKey) {
    return new Response(
      JSON.stringify({
        error: 'Google Maps API key not configured',
        help: 'Set GOOGLE_MAPS_API_KEY in your environment variables'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { citySlug } = await request.json();

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get city
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', citySlug)
    .single();

  if (cityError || !city) {
    return new Response(
      JSON.stringify({ error: 'City not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Venue types to search for (autism-friendly categories)
  const venueTypes = [
    { keyword: 'museum', type: 'museum' },
    { keyword: 'library', type: 'library' },
    { keyword: 'park', type: 'park' },
    { keyword: 'aquarium', type: 'museum' },
    { keyword: 'zoo', type: 'museum' },
    { keyword: 'playground', type: 'park' },
    { keyword: 'science center', type: 'museum' },
    { keyword: 'childrens museum', type: 'museum' },
    { keyword: 'indoor playground', type: 'gym' },
    { keyword: 'trampoline park', type: 'gym' },
  ];

  const allVenues: any[] = [];

  for (const { keyword, type } of venueTypes) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword + ' ' + city.name + ' ' + city.state)}&key=${googleApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        const venues = data.results.slice(0, 5).map((place: GooglePlace) => ({
          city_id: city.id,
          name: place.name,
          slug: place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: type,
          description: `A ${type} in ${city.name}, ${city.state}. Great for families with children.`,
          status: 'active',
          meter: 'Moderate',
        }));

        allVenues.push(...venues);
      }

      // Rate limit: wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching ${keyword}:`, error);
    }
  }

  if (allVenues.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No venues found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Insert venues (avoiding duplicates by slug)
  const { data: insertedVenues, error: insertError } = await supabase
    .from('venues')
    .upsert(allVenues, { onConflict: 'slug', ignoreDuplicates: true })
    .select();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Seeded ${insertedVenues?.length || 0} venues for ${city.name}`,
      venues: insertedVenues,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
