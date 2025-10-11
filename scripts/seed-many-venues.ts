import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Seed 200 venues per city from Google Places API
 * Run with: npx tsx scripts/seed-many-venues.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

if (!supabaseServiceKey || !googleApiKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expanded venue categories for autism-friendly places
const venueCategories = [
  // Museums & Education
  { keyword: 'museum', type: 'museum', meter: 'Quiet' },
  { keyword: 'science museum', type: 'museum', meter: 'Moderate' },
  { keyword: 'children museum', type: 'museum', meter: 'Busy' },
  { keyword: 'aquarium', type: 'museum', meter: 'Moderate' },
  { keyword: 'zoo', type: 'museum', meter: 'Busy' },
  { keyword: 'planetarium', type: 'museum', meter: 'Quiet' },
  { keyword: 'art gallery', type: 'museum', meter: 'Quiet' },

  // Libraries
  { keyword: 'public library', type: 'library', meter: 'Quiet' },
  { keyword: 'library branch', type: 'library', meter: 'Quiet' },

  // Parks & Recreation
  { keyword: 'park', type: 'park', meter: 'Moderate' },
  { keyword: 'playground', type: 'park', meter: 'Busy' },
  { keyword: 'nature center', type: 'park', meter: 'Quiet' },
  { keyword: 'botanical garden', type: 'park', meter: 'Quiet' },
  { keyword: 'dog park', type: 'park', meter: 'Busy' },
  { keyword: 'recreation center', type: 'gym', meter: 'Busy' },

  // Entertainment
  { keyword: 'movie theater', type: 'theater', meter: 'Moderate' },
  { keyword: 'bowling alley', type: 'gym', meter: 'Busy' },
  { keyword: 'arcade', type: 'gym', meter: 'Busy' },
  { keyword: 'trampoline park', type: 'gym', meter: 'Busy' },
  { keyword: 'indoor playground', type: 'gym', meter: 'Busy' },

  // Food
  { keyword: 'family restaurant', type: 'restaurant', meter: 'Moderate' },
  { keyword: 'cafe', type: 'restaurant', meter: 'Quiet' },
  { keyword: 'ice cream shop', type: 'restaurant', meter: 'Moderate' },
  { keyword: 'bakery', type: 'restaurant', meter: 'Quiet' },

  // Shopping
  { keyword: 'bookstore', type: 'library', meter: 'Quiet' },
  { keyword: 'toy store', type: 'gym', meter: 'Moderate' },

  // Sports & Fitness
  { keyword: 'swimming pool', type: 'gym', meter: 'Busy' },
  { keyword: 'yoga studio', type: 'gym', meter: 'Quiet' },
  { keyword: 'climbing gym', type: 'gym', meter: 'Moderate' },
];

interface GooglePlace {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  rating?: number;
  types: string[];
}

async function searchPlaces(query: string, cityName: string, state: string, pageToken?: string): Promise<{ places: GooglePlace[], nextPageToken?: string }> {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + cityName + ' ' + state)}&key=${googleApiKey}`;

  if (pageToken) {
    url += `&pagetoken=${pageToken}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK') {
    return {
      places: data.results || [],
      nextPageToken: data.next_page_token
    };
  }

  return { places: [] };
}

async function getPlacePhotos(placeId: string): Promise<string[]> {
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'photos'
      }
    });

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos.slice(0, 10).map((p: any) => p.name);
    }
  } catch (error) {
    console.error(`Error getting photos for ${placeId}:`, error);
  }

  return [];
}

async function downloadPhoto(photoName: string, outputPath: string): Promise<void> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${googleApiKey}&maxWidthPx=800`;

  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`Error downloading photo:`, error);
  }
}

async function seedCityVenues(citySlug: string, cityName: string, state: string, targetCount: number) {
  console.log(`\n🌆 Seeding ${cityName}, ${state} with ${targetCount} venues...\n`);

  // Get city from database
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();

  if (!city) {
    console.error(`City ${citySlug} not found`);
    return;
  }

  const photosDir = path.join(process.cwd(), 'public', 'venue-photos');
  await fs.mkdir(photosDir, { recursive: true });

  const seenPlaceIds = new Set<string>();
  let totalInserted = 0;

  for (const category of venueCategories) {
    if (totalInserted >= targetCount) break;

    console.log(`\n📍 Searching: ${category.keyword}...`);

    let pageToken: string | undefined;
    let pageCount = 0;
    const maxPages = 3; // Each page has ~20 results, 3 pages = 60 results per category

    do {
      const { places, nextPageToken } = await searchPlaces(category.keyword, cityName, state, pageToken);

      for (const place of places) {
        if (totalInserted >= targetCount) break;
        if (seenPlaceIds.has(place.place_id)) continue;

        seenPlaceIds.add(place.place_id);

        const slug = place.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50);

        // Check if venue already exists
        const { data: existing } = await supabase
          .from('venues')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          console.log(`   ⏭️  Skipping ${place.name} (already exists)`);
          continue;
        }

        console.log(`   ✓ Found: ${place.name}`);

        // Get photos
        const photoNames = await getPlacePhotos(place.place_id);
        const photoKeys: string[] = [];

        if (photoNames.length > 0) {
          console.log(`     📸 Downloading ${photoNames.length} photos...`);

          for (let i = 0; i < photoNames.length; i++) {
            const photoKey = `${slug}-${i + 1}.jpg`;
            const outputPath = path.join(photosDir, photoKey);

            await downloadPhoto(photoNames[i], outputPath);
            photoKeys.push(`/venue-photos/${photoKey}`);

            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const venue = {
          city_id: city.id,
          name: place.name,
          slug: slug,
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: category.type,
          description: `${place.name} - A ${category.type} in ${cityName}, ${state}. Great for families with children.`,
          status: 'active',
          meter: category.meter,
          photo_keys: photoKeys.length > 0 ? photoKeys : null,
        };

        // Insert immediately to save progress
        const { error } = await supabase
          .from('venues')
          .insert([venue]);

        if (error) {
          console.error(`     ❌ Error inserting ${place.name}:`, error.message);
        } else {
          totalInserted++;
          console.log(`     ✅ Saved venue ${totalInserted}/${targetCount}`);
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      pageToken = nextPageToken;
      pageCount++;

      if (pageToken && pageCount < maxPages) {
        // Wait for next page token to become valid (Google requires ~2 second delay)
        console.log(`     ⏳ Waiting for next page...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (pageToken && pageCount < maxPages && totalInserted < targetCount);
  }

  console.log(`\n✅ Successfully inserted ${totalInserted} venues for ${cityName}`);
}

async function main() {
  console.log('🚀 Starting mass venue seeding...\n');

  // Seed Dallas
  await seedCityVenues('dallas', 'Dallas', 'TX', 200);

  // Seed Houston
  await seedCityVenues('houston', 'Houston', 'TX', 200);

  console.log('\n\n🎉 Mass venue seeding complete!');
  process.exit(0);
}

main();
