import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getPlacePhotos(placeId: string): Promise<string[]> {
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
      return data.photos.slice(0, 10).map((photo: any) => photo.name);
    }
  } catch (error) {
    console.error(`Error getting photos:`, error);
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

async function fetchLibraryPhotos() {
  const photosDir = path.join(process.cwd(), 'public', 'venue-photos');

  // Dallas Library
  console.log('📍 Dallas Public Library - Central');
  const dallasPlaceId = 'ChIJ_bAHzx6ZToYRJZw7xxg7gzY';
  const dallasPhotos = await getPlacePhotos(dallasPlaceId);

  if (dallasPhotos.length > 0) {
    console.log(`   ✓ Found ${dallasPhotos.length} photos`);
    const photoKeys: string[] = [];

    for (let i = 0; i < dallasPhotos.length; i++) {
      const photoKey = `dallas-library-central-${i + 1}.jpg`;
      const outputPath = path.join(photosDir, photoKey);
      await downloadPhoto(dallasPhotos[i], outputPath);
      photoKeys.push(`/venue-photos/${photoKey}`);
      console.log(`   ✓ Downloaded photo ${i + 1}/${dallasPhotos.length}`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await supabase
      .from('venues')
      .update({ photo_keys: photoKeys })
      .eq('slug', 'dallas-library-central');

    console.log(`   ✅ Updated venue with ${photoKeys.length} photos\n`);
  }

  // Houston Library - use Julia Ideson Building as fallback
  console.log('📍 Houston Public Library - Central');
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName'
    },
    body: JSON.stringify({
      textQuery: 'Julia Ideson Building Houston Public Library',
      maxResultCount: 1
    })
  });

  const data = await response.json();

  if (data.places && data.places.length > 0) {
    const houstonPlaceId = data.places[0].id;
    console.log(`   ✓ Found alternative: ${data.places[0].displayName.text}`);

    const houstonPhotos = await getPlacePhotos(houstonPlaceId);

    if (houstonPhotos.length > 0) {
      console.log(`   ✓ Found ${houstonPhotos.length} photos`);
      const photoKeys: string[] = [];

      for (let i = 0; i < houstonPhotos.length; i++) {
        const photoKey = `houston-library-central-${i + 1}.jpg`;
        const outputPath = path.join(photosDir, photoKey);
        await downloadPhoto(houstonPhotos[i], outputPath);
        photoKeys.push(`/venue-photos/${photoKey}`);
        console.log(`   ✓ Downloaded photo ${i + 1}/${houstonPhotos.length}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await supabase
        .from('venues')
        .update({ photo_keys: photoKeys })
        .eq('slug', 'houston-library-central');

      console.log(`   ✅ Updated venue with ${photoKeys.length} photos\n`);
    }
  }

  console.log('🎉 Library photos complete!');
  process.exit(0);
}

fetchLibraryPhotos();
