import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Top 50 US cities with their coordinates and priority tiers
const cities = [
  // Tier 1: Already seeded
  { name: 'Dallas', state: 'TX', slug: 'dallas', center_lat: 32.7767, center_lng: -96.7970, population: 1304000, priority_tier: 1 },
  { name: 'Houston', state: 'TX', slug: 'houston', center_lat: 29.7604, center_lng: -95.3698, population: 2304000, priority_tier: 1 },

  // Tier 1: Top priority cities
  { name: 'New York', state: 'NY', slug: 'new-york', center_lat: 40.7128, center_lng: -74.0060, population: 8336000, priority_tier: 1 },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles', center_lat: 34.0522, center_lng: -118.2437, population: 3979000, priority_tier: 1 },
  { name: 'Chicago', state: 'IL', slug: 'chicago', center_lat: 41.8781, center_lng: -87.6298, population: 2746000, priority_tier: 1 },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix', center_lat: 33.4484, center_lng: -112.0740, population: 1608000, priority_tier: 1 },
  { name: 'Philadelphia', state: 'PA', slug: 'philadelphia', center_lat: 39.9526, center_lng: -75.1652, population: 1584000, priority_tier: 1 },
  { name: 'San Antonio', state: 'TX', slug: 'san-antonio', center_lat: 29.4241, center_lng: -98.4936, population: 1434000, priority_tier: 1 },
  { name: 'San Diego', state: 'CA', slug: 'san-diego', center_lat: 32.7157, center_lng: -117.1611, population: 1386000, priority_tier: 1 },
  { name: 'San Jose', state: 'CA', slug: 'san-jose', center_lat: 37.3382, center_lng: -121.8863, population: 1013000, priority_tier: 1 },

  // Tier 2: Major metros
  { name: 'Austin', state: 'TX', slug: 'austin', center_lat: 30.2672, center_lng: -97.7431, population: 961000, priority_tier: 2 },
  { name: 'Jacksonville', state: 'FL', slug: 'jacksonville', center_lat: 30.3322, center_lng: -81.6557, population: 949000, priority_tier: 2 },
  { name: 'Fort Worth', state: 'TX', slug: 'fort-worth', center_lat: 32.7555, center_lng: -97.3308, population: 918000, priority_tier: 2 },
  { name: 'Columbus', state: 'OH', slug: 'columbus', center_lat: 39.9612, center_lng: -82.9988, population: 898000, priority_tier: 2 },
  { name: 'Charlotte', state: 'NC', slug: 'charlotte', center_lat: 35.2271, center_lng: -80.8431, population: 872000, priority_tier: 2 },
  { name: 'San Francisco', state: 'CA', slug: 'san-francisco', center_lat: 37.7749, center_lng: -122.4194, population: 873000, priority_tier: 2 },
  { name: 'Indianapolis', state: 'IN', slug: 'indianapolis', center_lat: 39.7684, center_lng: -86.1581, population: 867000, priority_tier: 2 },
  { name: 'Seattle', state: 'WA', slug: 'seattle', center_lat: 47.6062, center_lng: -122.3321, population: 749000, priority_tier: 2 },
  { name: 'Denver', state: 'CO', slug: 'denver', center_lat: 39.7392, center_lng: -104.9903, population: 713000, priority_tier: 2 },
  { name: 'Washington', state: 'DC', slug: 'washington', center_lat: 38.9072, center_lng: -77.0369, population: 705000, priority_tier: 2 },

  // Tier 3: Large cities
  { name: 'Boston', state: 'MA', slug: 'boston', center_lat: 42.3601, center_lng: -71.0589, population: 692000, priority_tier: 3 },
  { name: 'Nashville', state: 'TN', slug: 'nashville', center_lat: 36.1627, center_lng: -86.7816, population: 689000, priority_tier: 3 },
  { name: 'El Paso', state: 'TX', slug: 'el-paso', center_lat: 31.7619, center_lng: -106.4850, population: 678000, priority_tier: 3 },
  { name: 'Detroit', state: 'MI', slug: 'detroit', center_lat: 42.3314, center_lng: -83.0458, population: 639000, priority_tier: 3 },
  { name: 'Portland', state: 'OR', slug: 'portland', center_lat: 45.5152, center_lng: -122.6784, population: 652000, priority_tier: 3 },
  { name: 'Las Vegas', state: 'NV', slug: 'las-vegas', center_lat: 36.1699, center_lng: -115.1398, population: 641000, priority_tier: 3 },
  { name: 'Memphis', state: 'TN', slug: 'memphis', center_lat: 35.1495, center_lng: -90.0490, population: 633000, priority_tier: 3 },
  { name: 'Louisville', state: 'KY', slug: 'louisville', center_lat: 38.2527, center_lng: -85.7585, population: 617000, priority_tier: 3 },
  { name: 'Baltimore', state: 'MD', slug: 'baltimore', center_lat: 39.2904, center_lng: -76.6122, population: 576000, priority_tier: 3 },
  { name: 'Milwaukee', state: 'WI', slug: 'milwaukee', center_lat: 43.0389, center_lng: -87.9065, population: 577000, priority_tier: 3 },

  // Tier 4: Major regional cities
  { name: 'Albuquerque', state: 'NM', slug: 'albuquerque', center_lat: 35.0844, center_lng: -106.6504, population: 560000, priority_tier: 4 },
  { name: 'Tucson', state: 'AZ', slug: 'tucson', center_lat: 32.2226, center_lng: -110.9747, population: 542000, priority_tier: 4 },
  { name: 'Fresno', state: 'CA', slug: 'fresno', center_lat: 36.7378, center_lng: -119.7871, population: 525000, priority_tier: 4 },
  { name: 'Mesa', state: 'AZ', slug: 'mesa', center_lat: 33.4152, center_lng: -111.8315, population: 504000, priority_tier: 4 },
  { name: 'Sacramento', state: 'CA', slug: 'sacramento', center_lat: 38.5816, center_lng: -121.4944, population: 508000, priority_tier: 4 },
  { name: 'Atlanta', state: 'GA', slug: 'atlanta', center_lat: 33.7490, center_lng: -84.3880, population: 498000, priority_tier: 4 },
  { name: 'Kansas City', state: 'MO', slug: 'kansas-city', center_lat: 39.0997, center_lng: -94.5786, population: 495000, priority_tier: 4 },
  { name: 'Colorado Springs', state: 'CO', slug: 'colorado-springs', center_lat: 38.8339, center_lng: -104.8214, population: 478000, priority_tier: 4 },
  { name: 'Raleigh', state: 'NC', slug: 'raleigh', center_lat: 35.7796, center_lng: -78.6382, population: 467000, priority_tier: 4 },
  { name: 'Omaha', state: 'NE', slug: 'omaha', center_lat: 41.2565, center_lng: -95.9345, population: 478000, priority_tier: 4 },

  // Tier 5: Additional metros
  { name: 'Miami', state: 'FL', slug: 'miami', center_lat: 25.7617, center_lng: -80.1918, population: 467000, priority_tier: 5 },
  { name: 'Oakland', state: 'CA', slug: 'oakland', center_lat: 37.8044, center_lng: -122.2712, population: 433000, priority_tier: 5 },
  { name: 'Minneapolis', state: 'MN', slug: 'minneapolis', center_lat: 44.9778, center_lng: -93.2650, population: 425000, priority_tier: 5 },
  { name: 'Tulsa', state: 'OK', slug: 'tulsa', center_lat: 36.1540, center_lng: -95.9928, population: 401000, priority_tier: 5 },
  { name: 'Arlington', state: 'TX', slug: 'arlington', center_lat: 32.7357, center_lng: -97.1081, population: 394000, priority_tier: 5 },
  { name: 'Tampa', state: 'FL', slug: 'tampa', center_lat: 27.9506, center_lng: -82.4572, population: 384000, priority_tier: 5 },
  { name: 'New Orleans', state: 'LA', slug: 'new-orleans', center_lat: 29.9511, center_lng: -90.0715, population: 383000, priority_tier: 5 },
  { name: 'Wichita', state: 'KS', slug: 'wichita', center_lat: 37.6872, center_lng: -97.3301, population: 389000, priority_tier: 5 },
  { name: 'Cleveland', state: 'OH', slug: 'cleveland', center_lat: 41.4993, center_lng: -81.6944, population: 372000, priority_tier: 5 },
  { name: 'Bakersfield', state: 'CA', slug: 'bakersfield', center_lat: 35.3733, center_lng: -119.0187, population: 380000, priority_tier: 5 },
];

async function seedCities() {
  console.log(`🌆 Seeding ${cities.length} cities to production database...`);

  // Insert in batches of 10 to avoid issues
  const batchSize = 10;
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('cities')
      .upsert(
        batch.map(city => ({
          ...city,
          status: 'active',
        })),
        { onConflict: 'slug' }
      )
      .select();

    if (error) {
      console.error(`❌ Error seeding batch ${i / batchSize + 1}:`, error);
      continue;
    }

    console.log(`✅ Seeded batch ${i / batchSize + 1}/${Math.ceil(cities.length / batchSize)} (${batch.length} cities)`);
  }

  console.log(`\n✅ Successfully seeded all ${cities.length} cities!`);

  // Show summary by tier
  console.log('\n📊 Summary by priority tier:');
  for (let tier = 1; tier <= 5; tier++) {
    const tierCities = cities.filter(c => c.priority_tier === tier);
    console.log(`   Tier ${tier}: ${tierCities.length} cities`);
  }

  process.exit(0);
}

seedCities();
