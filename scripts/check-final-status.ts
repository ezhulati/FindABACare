#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, state, status')
    .eq('status', 'active')
    .order('name');

  const citiesWithCounts = await Promise.all(
    (cities || []).map(async (city) => {
      const { count } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('status', 'active');
      return { ...city, count: count || 0 };
    })
  );

  const totalVenues = citiesWithCounts.reduce((sum, city) => sum + city.count, 0);

  console.log('\n📊 FINAL DATABASE STATUS\n');
  console.log(`Total Cities: ${citiesWithCounts.length}`);
  console.log(`Total Venues: ${totalVenues}`);
  console.log(`Average per city: ${Math.round(totalVenues / citiesWithCounts.length)}\n`);

  const under150 = citiesWithCounts.filter(c => c.count < 150).sort((a, b) => b.count - a.count);

  console.log(`Cities with < 150 venues: ${under150.length}\n`);
  under150.forEach(city => {
    const needed = 150 - city.count;
    console.log(`  ${city.name}, ${city.state}: ${city.count} venues (need ${needed})`);
  });
}

checkStatus();
