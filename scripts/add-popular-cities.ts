import { createClient } from '@supabase/supabase-js';

/**
 * Add popular US cities for national coverage
 * Run with: npx tsx scripts/add-popular-cities.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Top 20 US cities by population with geographic diversity
const popularCities = [
  // Existing
  { name: 'Dallas', state: 'TX', slug: 'dallas', center_lat: 32.7767, center_lng: -96.7970, population: 1343573, priority_tier: 1 },
  { name: 'Houston', state: 'TX', slug: 'houston', center_lat: 29.7604, center_lng: -95.3698, population: 2304580, priority_tier: 1 },

  // Top metros
  { name: 'New York', state: 'NY', slug: 'new-york', center_lat: 40.7128, center_lng: -74.0060, population: 8336817, priority_tier: 1 },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles', center_lat: 34.0522, center_lng: -118.2437, population: 3979576, priority_tier: 1 },
  { name: 'Chicago', state: 'IL', slug: 'chicago', center_lat: 41.8781, center_lng: -87.6298, population: 2746388, priority_tier: 1 },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix', center_lat: 33.4484, center_lng: -112.0740, population: 1680992, priority_tier: 1 },
  { name: 'Philadelphia', state: 'PA', slug: 'philadelphia', center_lat: 39.9526, center_lng: -75.1652, population: 1584064, priority_tier: 1 },
  { name: 'San Antonio', state: 'TX', slug: 'san-antonio', center_lat: 29.4241, center_lng: -98.4936, population: 1547253, priority_tier: 1 },
  { name: 'San Diego', state: 'CA', slug: 'san-diego', center_lat: 32.7157, center_lng: -117.1611, population: 1423851, priority_tier: 1 },
  { name: 'Austin', state: 'TX', slug: 'austin', center_lat: 30.2672, center_lng: -97.7431, population: 978908, priority_tier: 1 },

  // Regional diversity
  { name: 'Seattle', state: 'WA', slug: 'seattle', center_lat: 47.6062, center_lng: -122.3321, population: 749256, priority_tier: 2 },
  { name: 'Denver', state: 'CO', slug: 'denver', center_lat: 39.7392, center_lng: -104.9903, population: 715522, priority_tier: 2 },
  { name: 'Boston', state: 'MA', slug: 'boston', center_lat: 42.3601, center_lng: -71.0589, population: 692600, priority_tier: 2 },
  { name: 'Atlanta', state: 'GA', slug: 'atlanta', center_lat: 33.7490, center_lng: -84.3880, population: 498715, priority_tier: 2 },
  { name: 'Miami', state: 'FL', slug: 'miami', center_lat: 25.7617, center_lng: -80.1918, population: 467963, priority_tier: 2 },
  { name: 'Portland', state: 'OR', slug: 'portland', center_lat: 45.5051, center_lng: -122.6750, population: 652503, priority_tier: 2 },
  { name: 'Las Vegas', state: 'NV', slug: 'las-vegas', center_lat: 36.1699, center_lng: -115.1398, population: 641903, priority_tier: 2 },
  { name: 'Minneapolis', state: 'MN', slug: 'minneapolis', center_lat: 44.9778, center_lng: -93.2650, population: 429954, priority_tier: 2 },
];

async function addCities() {
  console.log('🌆 Adding popular cities...\n');

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const city of popularCities) {
    // Check if city exists
    const { data: existing } = await supabase
      .from('cities')
      .select('id, priority_tier, population')
      .eq('slug', city.slug)
      .single();

    if (existing) {
      // Update priority tier and population if different
      if (existing.priority_tier !== city.priority_tier || existing.population !== city.population) {
        const { error } = await supabase
          .from('cities')
          .update({
            priority_tier: city.priority_tier,
            population: city.population,
          })
          .eq('slug', city.slug);

        if (error) {
          console.error(`❌ Error updating ${city.name}:`, error.message);
        } else {
          console.log(`✓ Updated ${city.name}, ${city.state}`);
          updated++;
        }
      } else {
        console.log(`⏭️  Skipped ${city.name}, ${city.state} (already exists)`);
        skipped++;
      }
    } else {
      // Insert new city
      const { error } = await supabase
        .from('cities')
        .insert([{
          name: city.name,
          state: city.state,
          slug: city.slug,
          center_lat: city.center_lat,
          center_lng: city.center_lng,
          status: 'active',
          population: city.population,
          priority_tier: city.priority_tier,
        }]);

      if (error) {
        console.error(`❌ Error inserting ${city.name}:`, error.message);
      } else {
        console.log(`✓ Added ${city.name}, ${city.state}`);
        added++;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📈 Total: ${popularCities.length}\n`);
}

addCities();
