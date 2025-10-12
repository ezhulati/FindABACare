import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');

  // Check cities
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('*')
    .order('priority_tier', { ascending: true })
    .order('name');

  if (citiesError) {
    console.error('❌ Error fetching cities:', citiesError);
  } else {
    console.log(`📍 CITIES: ${cities?.length || 0} total\n`);
    console.log('Cities by state:');
    const byState = cities?.reduce((acc, city) => {
      if (!acc[city.state]) acc[city.state] = [];
      acc[city.state].push(city.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.keys(byState || {}).sort().forEach(state => {
      console.log(`   ${state}: ${byState[state].join(', ')}`);
    });
  }

  // Check venues count by city
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, city_id, cities(name, state)')
    .order('city_id');

  if (venuesError) {
    console.error('❌ Error fetching venues:', venuesError);
  } else {
    console.log(`\n🏢 VENUES: ${venues?.length || 0} total\n`);

    // Group by city
    const venuesByCity = venues?.reduce((acc, venue) => {
      const cityName = (venue.cities as any)?.name || 'Unknown';
      const state = (venue.cities as any)?.state || 'Unknown';
      const key = `${cityName}, ${state}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    console.log('Venues by city:');
    Object.entries(venuesByCity || {})
      .sort((a, b) => b[1] - a[1])
      .forEach(([city, count]) => {
        console.log(`   ${city}: ${count} venues`);
      });
  }

  process.exit(0);
}

checkDatabase();
