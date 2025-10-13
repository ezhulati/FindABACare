import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Fetch real photos for venues using Google Places API (New)
 * Run with: npx tsx scripts/fetch-real-photos.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

if (!supabaseServiceKey || !googleApiKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Place {
  id: string;
  displayName: { text: string };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

async function searchPlace(venueName: string, venueAddress: string): Promise<string | null> {
  const query = `${venueName}, ${venueAddress}`;

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos'
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1
      })
    });

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      return data.places[0].id;
    }
  } catch (error) {
    console.error(`Error searching for ${venueName}:`, error);
  }

  return null;
}

async function getPlaceDetails(placeId: string): Promise<string[]> {
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'photos'
      }
    });

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Get ALL photo names (up to 10 for performance)
      return data.photos.slice(0, 10).map((photo: any) => photo.name);
    }
  } catch (error) {
    console.error(`Error getting place details for ${placeId}:`, error);
  }

  return [];
}

async function downloadPhoto(photoName: string, outputPath: string): Promise<void> {
  // Photo name format: places/{place_id}/photos/{photo_id}
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${googleApiKey}&maxWidthPx=800`;

  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`Error downloading photo:`, error);
  }
}

async function fetchRealPhotos() {
  // Get all venues
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'active');

  if (error || !venues) {
    console.error('Error fetching venues:', error);
    process.exit(1);
  }

  console.log(`Found ${venues.length} venues\n`);

  // Create photos directory
  const photosDir = path.join(process.cwd(), 'public', 'venue-photos');
  await fs.mkdir(photosDir, { recursive: true });

  for (const venue of venues) {
    console.log(`📍 Processing: ${venue.name}`);

    // Search for place
    const placeId = await searchPlace(venue.name, venue.address || '');

    if (!placeId) {
      console.log(`   ❌ Could not find place`);
      continue;
    }

    console.log(`   ✓ Found place ID: ${placeId}`);

    // Get photos
    const photoNames = await getPlaceDetails(placeId);

    if (photoNames.length === 0) {
      console.log(`   ❌ No photos found`);
      continue;
    }

    console.log(`   ✓ Found ${photoNames.length} photos - downloading all`);

    // Download photos
    const photoKeys: string[] = [];
    for (let i = 0; i < photoNames.length; i++) {
      const photoKey = `${venue.slug}-${i + 1}.jpg`;
      const outputPath = path.join(photosDir, photoKey);

      await downloadPhoto(photoNames[i], outputPath);
      photoKeys.push(`/venue-photos/${photoKey}`);

      console.log(`   ✓ Downloaded photo ${i + 1}/${photoNames.length}`);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update venue with photo keys
    const { error: updateError } = await supabase
      .from('venues')
      .update({ photo_keys: photoKeys })
      .eq('id', venue.id);

    if (updateError) {
      console.log(`   ❌ Error updating venue:`, updateError);
    } else {
      console.log(`   ✅ Updated venue with ${photoKeys.length} photos\n`);
    }

    // Rate limit between venues
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Photo fetching complete!');
  process.exit(0);
}

fetchRealPhotos();
