import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Fetch photos for venues from Google Places and save them
 * Run with: npx tsx scripts/fetch-venue-photos.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

if (!supabaseServiceKey || !googleApiKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PlaceDetails {
  place_id?: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

async function findPlaceId(venueName: string, venueAddress: string): Promise<string | null> {
  const query = `${venueName} ${venueAddress}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${googleApiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
  } catch (error) {
    console.error(`Error finding place ID for ${venueName}:`, error);
  }

  return null;
}

async function getPlacePhotos(placeId: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${googleApiKey}`;

  try {
    const response = await fetch(url);
    const data: { result?: PlaceDetails; status: string } = await response.json();

    if (data.status === 'OK' && data.result?.photos && data.result.photos.length > 0) {
      // Get up to 3 photo references
      return data.result.photos.slice(0, 3).map(photo => photo.photo_reference);
    }
  } catch (error) {
    console.error(`Error getting photos for place ${placeId}:`, error);
  }

  return [];
}

async function downloadPhoto(photoReference: string, outputPath: string): Promise<void> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${googleApiKey}`;

  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`Error downloading photo:`, error);
  }
}

async function fetchVenuePhotos() {
  // Get all venues
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'active');

  if (error || !venues) {
    console.error('Error fetching venues:', error);
    process.exit(1);
  }

  console.log(`Found ${venues.length} venues`);

  // Create photos directory
  const photosDir = path.join(process.cwd(), 'public', 'venue-photos');
  await fs.mkdir(photosDir, { recursive: true });

  for (const venue of venues) {
    console.log(`\n📍 Processing: ${venue.name}`);

    // Find place ID
    const placeId = await findPlaceId(venue.name, venue.address || '');

    if (!placeId) {
      console.log(`   ❌ Could not find place ID`);
      continue;
    }

    console.log(`   ✓ Found place ID: ${placeId}`);

    // Get photo references
    const photoRefs = await getPlacePhotos(placeId);

    if (photoRefs.length === 0) {
      console.log(`   ❌ No photos found`);
      continue;
    }

    console.log(`   ✓ Found ${photoRefs.length} photos`);

    // Download photos
    const photoKeys: string[] = [];
    for (let i = 0; i < photoRefs.length; i++) {
      const photoKey = `${venue.slug}-${i + 1}.jpg`;
      const outputPath = path.join(photosDir, photoKey);

      await downloadPhoto(photoRefs[i], outputPath);
      photoKeys.push(`/venue-photos/${photoKey}`);

      console.log(`   ✓ Downloaded photo ${i + 1}/${photoRefs.length}`);

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
      console.log(`   ✅ Updated venue with ${photoKeys.length} photos`);
    }

    // Rate limit between venues
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Photo fetching complete!');
  process.exit(0);
}

fetchVenuePhotos();
