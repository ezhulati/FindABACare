import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Places API pricing (as of 2024)
// Nearby Search: $32 per 1000 requests
// Place Details: $17 per 1000 requests
// Photos: $7 per 1000 requests

const VENUES_PER_CITY_TIER: Record<number, number> = {
  1: 200,  // Tier 1: Top priority cities (8 cities)
  2: 150,  // Tier 2: Major metros (10 cities)
  3: 100,  // Tier 3: Large cities (10 cities)
  4: 75,   // Tier 4: Regional cities (10 cities)
  5: 50,   // Tier 5: Additional metros (12 cities)
};

async function planImports() {
  console.log('📋 Creating venue import plan...\n');

  // Fetch all cities with venue counts
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, state, slug, priority_tier')
    .eq('status', 'active')
    .order('priority_tier', { ascending: true })
    .order('population', { ascending: false });

  if (citiesError) {
    console.error('❌ Error fetching cities:', citiesError);
    process.exit(1);
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
        currentVenues: count || 0,
        targetVenues: VENUES_PER_CITY_TIER[city.priority_tier] || 50,
      };
    })
  );

  // Separate cities into those with and without venues
  const citiesWithVenues = citiesWithCounts.filter(c => c.currentVenues > 0);
  const citiesWithoutVenues = citiesWithCounts.filter(c => c.currentVenues === 0);

  console.log(`📊 CURRENT STATUS:\n`);
  console.log(`   Total cities: ${citiesWithCounts.length}`);
  console.log(`   Cities with venues: ${citiesWithVenues.length}`);
  console.log(`   Cities without venues: ${citiesWithoutVenues.length}\n`);

  console.log(`🏆 CITIES WITH VENUES:\n`);
  citiesWithVenues.forEach(city => {
    const status = city.currentVenues >= city.targetVenues ? '✅' : '⚠️';
    console.log(`   ${status} ${city.name}, ${city.state}: ${city.currentVenues}/${city.targetVenues} (Tier ${city.priority_tier})`);
  });

  console.log(`\n📍 CITIES NEEDING VENUES (Priority Order):\n`);

  // Group by tier for planning
  const tierGroups: Record<number, typeof citiesWithoutVenues> = {};
  citiesWithoutVenues.forEach(city => {
    if (!tierGroups[city.priority_tier]) {
      tierGroups[city.priority_tier] = [];
    }
    tierGroups[city.priority_tier].push(city);
  });

  let totalVenuesToImport = 0;
  let totalEstimatedCost = 0;

  for (let tier = 1; tier <= 5; tier++) {
    const citiesInTier = tierGroups[tier] || [];
    if (citiesInTier.length === 0) continue;

    const venuesPerCity = VENUES_PER_CITY_TIER[tier];
    const tierTotalVenues = citiesInTier.length * venuesPerCity;

    // Cost estimation per venue:
    // - 1 Nearby Search request per 20 venues (pagination) = ~1.6 per venue * $0.032 = $0.05
    // - 1 Place Details request per venue = $0.017
    // - Average 2 photos per venue = 2 * $0.007 = $0.014
    // Total per venue: ~$0.08
    const costPerVenue = 0.08;
    const tierCost = tierTotalVenues * costPerVenue;

    totalVenuesToImport += tierTotalVenues;
    totalEstimatedCost += tierCost;

    console.log(`\n   📌 TIER ${tier} (${venuesPerCity} venues per city):`);
    console.log(`   Cities: ${citiesInTier.map(c => `${c.name}, ${c.state}`).join(' | ')}`);
    console.log(`   Total venues: ${tierTotalVenues}`);
    console.log(`   Estimated cost: $${tierCost.toFixed(2)}`);
  }

  console.log(`\n💰 TOTAL COST ESTIMATE:\n`);
  console.log(`   Cities to import: ${citiesWithoutVenues.length}`);
  console.log(`   Total venues: ${totalVenuesToImport.toLocaleString()}`);
  console.log(`   Estimated cost: $${totalEstimatedCost.toFixed(2)}\n`);

  console.log(`📝 RECOMMENDED IMPORT STRATEGY:\n`);
  console.log(`   1. Start with Tier 1 cities (highest priority/population)`);
  console.log(`   2. Import in batches of 3-5 cities to manage costs`);
  console.log(`   3. Monitor API quotas and billing during imports`);
  console.log(`   4. Use existing seed-many-venues.ts script with city filters\n`);

  console.log(`🚀 NEXT STEPS:\n`);
  console.log(`   Run: npm run seed:venues -- --tier 1`);
  console.log(`   Then: npm run seed:venues -- --tier 2`);
  console.log(`   And so on...\n`);

  // Generate detailed import commands
  console.log(`📋 DETAILED IMPORT COMMANDS:\n`);

  for (let tier = 1; tier <= 5; tier++) {
    const citiesInTier = tierGroups[tier] || [];
    if (citiesInTier.length === 0) continue;

    console.log(`\n   # Tier ${tier} - ${citiesInTier.length} cities`);
    citiesInTier.forEach(city => {
      console.log(`   # ${city.name}, ${city.state} (${VENUES_PER_CITY_TIER[tier]} venues)`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY="<key>" GOOGLE_MAPS_API_KEY="<key>" \\`);
      console.log(`     npx tsx scripts/seed-many-venues.ts --city-slug="${city.slug}"\n`);
    });
  }

  process.exit(0);
}

planImports();
