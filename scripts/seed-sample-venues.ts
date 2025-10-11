import { createClient } from '@supabase/supabase-js';

/**
 * Seed sample venues for Dallas and Houston
 * Run with: npx tsx scripts/seed-sample-venues.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dallasSampleVenues = [
  {
    name: 'Perot Museum of Nature and Science',
    slug: 'perot-museum',
    address: '2201 N Field St, Dallas, TX 75201',
    lat: 32.7868,
    lng: -96.8067,
    type: 'museum',
    description: 'Interactive science museum with sensory-friendly hours and autism-friendly programs.',
    sensory_hours: [{ day: 'Saturday', start_time: '09:00', end_time: '11:00', description: 'Sensory-Friendly Saturday - quieter environment with reduced lighting and sound' }],
    amenities: { quiet_room: true, visual_supports: true, hand_dryer: false, lighting_control: true },
    triggers: { loud_music: false, strong_scents: false, crowds: true },
    status: 'active',
    meter: 'Quiet',
  },
  {
    name: 'Dallas Arboretum and Botanical Garden',
    slug: 'dallas-arboretum',
    address: '8525 Garland Rd, Dallas, TX 75218',
    lat: 32.8209,
    lng: -96.7183,
    type: 'park',
    description: 'Beautiful outdoor gardens with wide paths and quiet spaces perfect for sensory breaks.',
    amenities: { outdoor_space: true, quiet_areas: true, accessible_paths: true },
    triggers: { crowds: false, strong_scents: true },
    status: 'active',
    meter: 'Moderate',
  },
  {
    name: 'Dallas Zoo',
    slug: 'dallas-zoo',
    address: '650 S R.L. Thornton Fwy, Dallas, TX 75203',
    lat: 32.7409,
    lng: -96.8153,
    type: 'museum',
    description: 'Family-friendly zoo with quiet morning hours and autism resource guides available.',
    sensory_hours: [{ day: 'Sunday', start_time: '08:00', end_time: '10:00', description: 'Quiet Hours - before general admission' }],
    amenities: { quiet_room: true, stroller_friendly: true },
    triggers: { crowds: true, animal_sounds: true },
    status: 'active',
    meter: 'Busy',
  },
  {
    name: 'Dallas Public Library - Central',
    slug: 'dallas-library-central',
    address: '1515 Young St, Dallas, TX 75201',
    lat: 32.7833,
    lng: -96.7978,
    type: 'library',
    description: 'Quiet library with dedicated children\'s area and sensory story times.',
    amenities: { quiet_room: true, visual_supports: true, sensory_toys: true },
    triggers: { loud_music: false, crowds: false },
    status: 'active',
    meter: 'Quiet',
  },
  {
    name: 'Klyde Warren Park',
    slug: 'klyde-warren-park',
    address: '2012 Woodall Rodgers Fwy, Dallas, TX 75201',
    lat: 32.7895,
    lng: -96.8015,
    type: 'park',
    description: 'Urban park with playgrounds, food trucks, and open spaces for play.',
    amenities: { outdoor_space: true, playground: true, food_available: true },
    triggers: { crowds: true, food_smells: true },
    status: 'active',
    meter: 'Moderate',
  },
];

const houstonSampleVenues = [
  {
    name: 'Houston Museum of Natural Science',
    slug: 'houston-museum-natural-science',
    address: '5555 Hermann Park Dr, Houston, TX 77030',
    lat: 29.7220,
    lng: -95.3895,
    type: 'museum',
    description: 'World-class museum with sensory-friendly events and quiet viewing hours.',
    sensory_hours: [{ day: 'First Sunday', start_time: '09:00', end_time: '12:00', description: 'Sensory-Friendly Sunday' }],
    amenities: { quiet_room: true, visual_supports: true, dimmed_lighting: true },
    triggers: { crowds: true, loud_sounds: false },
    status: 'active',
    meter: 'Moderate',
  },
  {
    name: 'Houston Zoo',
    slug: 'houston-zoo',
    address: '6200 Hermann Park Dr, Houston, TX 77030',
    lat: 29.7152,
    lng: -95.3903,
    type: 'museum',
    description: 'Large zoo with autism-friendly maps and quiet zones throughout.',
    amenities: { quiet_areas: true, accessible_paths: true, stroller_friendly: true },
    triggers: { crowds: true, animal_sounds: true },
    status: 'active',
    meter: 'Busy',
  },
  {
    name: 'Houston Public Library - Central',
    slug: 'houston-library-central',
    address: '500 McKinney St, Houston, TX 77002',
    lat: 29.7599,
    lng: -95.3677,
    type: 'library',
    description: 'Modern library with quiet study rooms and sensory story times for children.',
    amenities: { quiet_room: true, visual_supports: true, sensory_toys: true },
    triggers: { loud_music: false, crowds: false },
    status: 'active',
    meter: 'Quiet',
  },
  {
    name: 'Discovery Green',
    slug: 'discovery-green',
    address: '1500 McKinney St, Houston, TX 77010',
    lat: 29.7533,
    lng: -95.3597,
    type: 'park',
    description: 'Downtown park with interactive water features, playgrounds, and green spaces.',
    amenities: { outdoor_space: true, playground: true, water_features: true },
    triggers: { crowds: true, water_sounds: false },
    status: 'active',
    meter: 'Moderate',
  },
  {
    name: 'Children\'s Museum Houston',
    slug: 'childrens-museum-houston',
    address: '1500 Binz St, Houston, TX 77004',
    lat: 29.7234,
    lng: -95.3854,
    type: 'museum',
    description: 'Hands-on children\'s museum with sensory-friendly hours and autism resources.',
    sensory_hours: [{ day: 'Saturday', start_time: '17:00', end_time: '19:00', description: 'Sensory-Friendly Evening' }],
    amenities: { quiet_room: true, sensory_play: true, visual_supports: true },
    triggers: { crowds: true, loud_sounds: true },
    status: 'active',
    meter: 'Busy',
  },
];

async function seedVenues() {
  // Get Dallas city
  const { data: dallas } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'dallas')
    .single();

  // Get Houston city
  const { data: houston } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'houston')
    .single();

  if (!dallas || !houston) {
    console.error('Cities not found');
    process.exit(1);
  }

  // Add city_id to venues
  const dallasVenues = dallasSampleVenues.map(v => ({ ...v, city_id: dallas.id }));
  const houstonVenues = houstonSampleVenues.map(v => ({ ...v, city_id: houston.id }));

  // Insert Dallas venues
  const { data: dallasInserted, error: dallasError } = await supabase
    .from('venues')
    .upsert(dallasVenues, { onConflict: 'slug' })
    .select();

  if (dallasError) {
    console.error('Error inserting Dallas venues:', dallasError);
  } else {
    console.log(`✅ Inserted ${dallasInserted?.length || 0} Dallas venues`);
  }

  // Insert Houston venues
  const { data: houstonInserted, error: houstonError } = await supabase
    .from('venues')
    .upsert(houstonVenues, { onConflict: 'slug' })
    .select();

  if (houstonError) {
    console.error('Error inserting Houston venues:', houstonError);
  } else {
    console.log(`✅ Inserted ${houstonInserted?.length || 0} Houston venues`);
  }

  console.log('\n🎉 Venue seeding complete!');
  process.exit(0);
}

seedVenues();
