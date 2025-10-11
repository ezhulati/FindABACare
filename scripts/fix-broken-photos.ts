import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = 'AIzaSyDzaHqZcpfdSKPCNkDizt7wTX2NPRlHLWc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const brokenPhotos = [
  { slug: 'houston-zoo', photoIndex: 2, placeId: 'ChIJEzJREIa_QIYR-GkQRMwI9GE' },
  { slug: 'houston-museum-natural-science', photoIndex: 9, placeId: 'ChIJqzEuToa_QIYRetkd7kIw47s' },
  { slug: 'houston-museum-natural-science', photoIndex: 5, placeId: 'ChIJqzEuToa_QIYRetkd7kIw47s' },
  { slug: 'dallas-arboretum', photoIndex: 5, placeId: 'ChIJRxtoZJqhToYRQnaLBzeSE2g' },
  { slug: 'discovery-green', photoIndex: 9, placeId: 'ChIJJUo2UyK_QIYRI_nLX1af7Qg' },
];

async function getPlacePhotos(placeId: string): Promise<string[]> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': googleApiKey,
      'X-Goog-FieldMask': 'photos'
    }
  });

  const data = await response.json();
  if (data.photos && data.photos.length > 0) {
    return data.photos.map((p: any) => p.name);
  }
  return [];
}

async function downloadPhoto(photoName: string, outputPath: string): Promise<void> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${googleApiKey}&maxWidthPx=800`;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

async function fixBrokenPhotos() {
  const photosDir = path.join(process.cwd(), 'public', 'venue-photos');

  for (const broken of brokenPhotos) {
    console.log(`Fixing ${broken.slug} photo ${broken.photoIndex}...`);

    const photoNames = await getPlacePhotos(broken.placeId);

    if (photoNames.length > broken.photoIndex - 1) {
      const photoKey = `${broken.slug}-${broken.photoIndex}.jpg`;
      const outputPath = path.join(photosDir, photoKey);

      await downloadPhoto(photoNames[broken.photoIndex - 1], outputPath);
      console.log(`✓ Fixed ${photoKey}`);

      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      console.log(`❌ Not enough photos for ${broken.slug}`);
    }
  }

  console.log('\n✅ Broken photos fixed!');
  process.exit(0);
}

fixBrokenPhotos();
