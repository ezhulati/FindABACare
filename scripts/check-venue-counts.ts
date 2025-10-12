import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkProgress() {
  // Get all cities with venue counts
  const { data: cities } = await supabase
    .from('cities')
    .select('name, state, slug')
    .eq('status', 'active')
    .order('priority_tier', { ascending: true })
    .order('population', { ascending: false });

  console.log('📊 VENUE COUNTS BY CITY:\n');
  console.log('City                          | Venues');
  console.log('-------------------------------------|--------');

  for (const city of cities || []) {
    // Get city ID first
    const { data: cityData } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', city.slug)
      .single();

    const { count } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', cityData?.id || '')
      .eq('status', 'active');

    const venueCount = count || 0;
    const cityName = `${city.name}, ${city.state}`.padEnd(36);
    const icon = venueCount >= 200 ? '✅' : venueCount > 0 ? '🔄' : '⏳';
    console.log(`${icon} ${cityName} | ${venueCount}`);
  }

  // Total venues
  const { count: totalCount } = await supabase
    .from('venues')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  console.log('\n📈 TOTAL VENUES: ' + (totalCount || 0).toLocaleString());

  // Show recent additions
  console.log('\n🆕 RECENTLY ADDED VENUES (last 20):');
  const { data: recentVenues } = await supabase
    .from('venues')
    .select('name, city_id, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentVenues) {
    for (const venue of recentVenues) {
      const date = new Date(venue.created_at).toLocaleTimeString();
      console.log(`  • ${venue.name} (${venue.city_id}) - ${date}`);
    }
  }
}

checkProgress();
