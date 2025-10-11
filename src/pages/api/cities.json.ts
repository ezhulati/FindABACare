import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch all active cities with venue counts
  const { data: cities, error } = await supabase
    .from('cities')
    .select(`
      id,
      name,
      slug,
      state,
      center_lat,
      center_lng,
      population,
      priority_tier
    `)
    .eq('status', 'active')
    .order('priority_tier', { ascending: true })
    .order('population', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get venue counts for each city
  const citiesWithCounts = await Promise.all(
    (cities || []).map(async (city) => {
      const { count } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('status', 'active');

      return {
        ...city,
        venueCount: count || 0
      };
    })
  );

  // Group by state
  const groupedByState = citiesWithCounts.reduce((acc, city) => {
    const state = city.state;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(city);
    return acc;
  }, {} as Record<string, typeof citiesWithCounts>);

  return new Response(
    JSON.stringify({
      cities: citiesWithCounts,
      byState: groupedByState,
      total: citiesWithCounts.length,
      totalVenues: citiesWithCounts.reduce((sum, city) => sum + city.venueCount, 0)
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    }
  );
};
