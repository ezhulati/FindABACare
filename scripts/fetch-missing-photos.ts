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
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'venue-photos');

if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_MAPS_API_KEY not set');
  process.exit(1);
}

// Ensure photos directory exists
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

async function findPlaceByName(name: string, address: string): Promise<string | null> {
  const query = `${name} ${address}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
  } catch (error: any) {
    console.error(`  Error finding place: ${error.message}`);
  }

  return null;
}

async function getPlacePhotos(placeId: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.result && data.result.photos) {
      return data.result.photos.slice(0, 5).map((photo: any) => photo.photo_reference);
    }
  } catch (error: any) {
    console.error(`  Error getting place photos: ${error.message}`);
  }

  return [];
}

async function downloadPhoto(photoReference: string, outputPath: string): Promise<boolean> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error: any) {
    console.error(`  Error downloading photo: ${error.message}`);
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
      console.error(`  ✗ Error uploading ${filename}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error: any) {
    console.error(`  ✗ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function processVenue(venue: any) {
  console.log(`\n📍 ${venue.name}`);

  // Find place on Google
  const placeId = await findPlaceByName(venue.name, venue.address);
  if (!placeId) {
    console.log('  ⚠️  Could not find place on Google Maps');
    return;
  }

  console.log(`  ✓ Found place ID: ${placeId}`);

  // Get photos
  const photoRefs = await getPlacePhotos(placeId);
  if (photoRefs.length === 0) {
    console.log('  ⚠️  No photos available on Google Maps');
    return;
  }

  console.log(`  ✓ Found ${photoRefs.length} photos`);

  const photoUrls: string[] = [];

  // Download and upload each photo
  for (let i = 0; i < photoRefs.length; i++) {
    const filename = `${venue.slug}-${i + 1}.jpg`;
    const filepath = path.join(PHOTOS_DIR, filename);

    // Download from Google
    const downloaded = await downloadPhoto(photoRefs[i], filepath);
    if (!downloaded) {
      console.log(`  ✗ Failed to download photo ${i + 1}`);
      continue;
    }

    // Upload to Supabase
    const publicUrl = await uploadToSupabase(filepath, filename);
    if (publicUrl) {
      photoUrls.push(publicUrl);
      console.log(`  ✅ Uploaded photo ${i + 1}`);

      // Clean up local file
      fs.unlinkSync(filepath);
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Update database
  if (photoUrls.length > 0) {
    const { error } = await supabase
      .from('venues')
      .update({ photo_keys: photoUrls })
      .eq('id', venue.id);

    if (error) {
      console.log(`  ✗ Error updating database: ${error.message}`);
    } else {
      console.log(`  ✓ Updated database with ${photoUrls.length} photos`);
    }
  }
}

async function main() {
  console.log('Fetching photos for venues with NULL photo_keys');
  console.log('='.repeat(50));

  // Get venues with null photo_keys
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, address')
    .is('photo_keys', null)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }

  console.log(`\nFound ${venues.length} venues without photos\n`);

  for (const venue of venues) {
    await processVenue(venue);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Done!');
}

main();
