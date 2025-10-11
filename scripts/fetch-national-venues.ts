import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Venue types to fetch (autism-friendly categories)
const VENUE_TYPES = [
  'museum',
  'park',
  'library',
  'aquarium',
  'zoo',
  'movie_theater',
  'bowling_alley',
  'amusement_park',
  'tourist_attraction',
  'art_gallery'
];

interface City {
  city: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
  population: number;
}

async function searchNearby(lat: number, lng: number, type: string, radius: number = 25000): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status === 'OK') {
      return data.results || [];
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error(`  ✗ API error: ${data.status} - ${data.error_message}`);
      return [];
    }
  } catch (error: any) {
    console.error(`  ✗ Fetch error: ${error.message}`);
    return [];
  }
}

async function getPlaceDetails(placeId: string) {
  const fields = 'place_id,name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,types,website,formatted_phone_number';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

function determineVenueType(types: string[]): string {
  if (types.includes('museum')) return 'Museum';
  if (types.includes('park')) return 'Park';
  if (types.includes('library')) return 'Library';
  if (types.includes('aquarium')) return 'Aquarium';
  if (types.includes('zoo')) return 'Zoo';
  if (types.includes('movie_theater')) return 'Movie Theater';
  if (types.includes('bowling_alley')) return 'Recreation';
  if (types.includes('amusement_park')) return 'Recreation';
  if (types.includes('art_gallery')) return 'Museum';
  return 'Other';
}

async function downloadPhoto(photoReference: string, outputPath: string): Promise<boolean> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    return false;
  }
}

async function uploadToSupabase(filepath: string, filename: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filepath);

    const { data, error } = await supabase.storage
      .from('venue-photos')
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    return null;
  }
}

async function processVenue(place: any, cityId: string, citySlug: string, tempDir: string) {
  // Check if already exists
  const { data: existing } = await supabase
    .from('venues')
    .select('id')
    .eq('google_place_id', place.place_id)
    .single();

  if (existing) {
    return; // Already have this venue
  }

  // Get full details
  const details = await getPlaceDetails(place.place_id);
  if (!details) return;

  // Filter out low-rated venues
  if (details.rating && details.rating < 3.5) {
    return;
  }

  // Create slug from name
  const slug = details.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Download and upload first photo
  const photoUrls: string[] = [];
  if (details.photos && details.photos.length > 0) {
    const photo = details.photos[0];
    const filename = `${slug}-${Date.now()}.jpg`;
    const filepath = path.join(tempDir, filename);

    const downloaded = await downloadPhoto(photo.photo_reference, filepath);
    if (downloaded) {
      const publicUrl = await uploadToSupabase(filepath, filename);
      if (publicUrl) {
        photoUrls.push(publicUrl);
      }
      // Clean up local file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }

  // Insert venue
  const venueType = determineVenueType(details.types || []);

  const { error } = await supabase.from('venues').insert({
    city_id: cityId,
    name: details.name,
    slug: `${citySlug}-${slug}`,
    address: details.formatted_address,
    lat: details.geometry?.location?.lat,
    lng: details.geometry?.location?.lng,
    type: venueType,
    google_place_id: place.place_id,
    google_rating: details.rating,
    google_review_count: details.user_ratings_total,
    is_open_now: details.opening_hours?.open_now,
    hours: details.opening_hours?.weekday_text || null,
    photo_keys: photoUrls.length > 0 ? photoUrls : null,
    data_source: 'google_places',
    verification_status: 'unverified',
    status: 'active',
    last_synced_at: new Date().toISOString()
  });

  if (error) {
    console.error(`    ✗ Error inserting ${details.name}: ${error.message}`);
  } else {
    console.log(`    ✓ Added: ${details.name}`);
  }
}

async function fetchCityVenues(city: City) {
  console.log(`\n📍 ${city.city}, ${city.state}`);

  // Get or create city
  let { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', city.slug)
    .eq('state', city.state.toUpperCase())
    .single();

  if (!cityData) {
    // Create city
    const { data: newCity, error: insertError } = await supabase
      .from('cities')
      .insert({
        name: city.city,
        slug: city.slug,
        state: city.state.toUpperCase(),
        center_lat: city.lat,
        center_lng: city.lng,
        population: city.population,
        priority_tier: 2,
        auto_sync_enabled: true,
        status: 'active'
      })
      .select('id')
      .single();

    if (insertError || !newCity) {
      console.error(`  ✗ Failed to create city: ${insertError?.message}`);
      return;
    }
    cityData = newCity;
  }

  const cityId = cityData.id;

  // Create temp directory for photos
  const tempDir = path.join(__dirname, '..', 'temp-photos');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let totalAdded = 0;

  // Fetch venues for each type
  for (const venueType of VENUE_TYPES) {
    console.log(`  🔍 Searching ${venueType}s...`);

    const places = await searchNearby(city.lat, city.lng, venueType);
    console.log(`    Found ${places.length} results`);

    for (const place of places) {
      await processVenue(place, cityId, city.slug, tempDir);
      totalAdded++;

      // Rate limiting - max 50 requests per second
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`  ✅ Total venues added: ${totalAdded}`);
}

async function main() {
  const args = process.argv.slice(2);
  const limitFlag = args.find(arg => arg.startsWith('--limit='));
  const limit = limitFlag ? parseInt(limitFlag.split('=')[1]) : undefined;

  console.log('🚀 Fetching venues for top US cities');
  console.log('='.repeat(60));

  // Load cities
  const citiesPath = path.join(__dirname, '..', 'data', 'top-50-cities.json');
  const cities: City[] = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));

  const citiesToProcess = limit ? cities.slice(0, limit) : cities;

  console.log(`\nProcessing ${citiesToProcess.length} cities...\n`);

  for (const city of citiesToProcess) {
    await fetchCityVenues(city);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Done!');
}

main();
