import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = 'AIzaSyDzaHqZcpfdSKPCNkDizt7wTX2NPRlHLWc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const placeId = 'ChIJcf6vtjm_QIYRLD07rhduhG4';
const photosDir = path.join(process.cwd(), 'public', 'venue-photos');

async function downloadPhoto(photoName: string, outputPath: string): Promise<void> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${googleApiKey}&maxWidthPx=800`;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

async function fix() {
  console.log('Fetching Houston library photos...');

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': googleApiKey,
      'X-Goog-FieldMask': 'photos'
    }
  });

  const data = await response.json();
  const photoNames = data.photos.slice(0, 10).map((p: any) => p.name);

  console.log(`Found ${photoNames.length} photos`);

  const photoKeys: string[] = [];

  for (let i = 0; i < photoNames.length; i++) {
    const photoKey = `houston-library-central-${i + 1}.jpg`;
    const outputPath = path.join(photosDir, photoKey);
    await downloadPhoto(photoNames[i], outputPath);
    photoKeys.push(`/venue-photos/${photoKey}`);
    console.log(`Downloaded ${i + 1}/${photoNames.length}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  await supabase
    .from('venues')
    .update({ photo_keys: photoKeys })
    .eq('slug', 'houston-library-central');

  console.log(`✅ Updated venue with ${photoKeys.length} photos`);
  process.exit(0);
}

fix();
