import { createClient } from '@supabase/supabase-js';

/**
 * Add photos for venues that don't have any
 * Uses Wikimedia Commons photos linked to OpenStreetMap data
 * 100% FREE with no API key required
 *
 * Run with: npx tsx scripts/add-missing-photos.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Venue {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  type: string;
}

// Sleep function to respect rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search Wikimedia Commons for images of a venue
 */
async function searchWikimediaImages(venueName: string): Promise<string[]> {
  try {
    // Search Wikimedia Commons API for images
    const searchQuery = encodeURIComponent(venueName);
    const url = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `format=json&` +
      `generator=search&` +
      `gsrsearch=${searchQuery}&` +
      `gsrnamespace=6&` + // File namespace
      `gsrlimit=3&` +
      `prop=imageinfo&` +
      `iiprop=url|size&` +
      `iiurlwidth=1200`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FindABACare/1.0 (Autism-friendly venue directory)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.query || !data.query.pages) {
      return [];
    }

    const images: string[] = [];
    for (const page of Object.values(data.query.pages) as any[]) {
      if (page.imageinfo && page.imageinfo[0]) {
        const imageUrl = page.imageinfo[0].url || page.imageinfo[0].thumburl;
        if (imageUrl) {
          images.push(imageUrl);
        }
      }
    }

    return images;
  } catch (error) {
    console.error(`   ⚠️  Wikimedia search failed:`, error);
    return [];
  }
}

async function addMissingPhotos() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   ADDING PHOTOS FROM WIKIMEDIA COMMONS');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📅 ${new Date().toLocaleString()}\n`);

  // Get venues without photos
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, lat, lng, type')
    .is('photo_keys', null)
    .limit(100); // Process 100 at a time

  if (error) {
    console.error('❌ Error fetching venues:', error);
    return;
  }

  if (!venues || venues.length === 0) {
    console.log('✅ No venues without photos found!');
    return;
  }

  console.log(`Found ${venues.length} venues without photos\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    console.log(`\n[${i + 1}/${venues.length}] ${venue.name}`);

    try {
      // Search Wikimedia Commons for images
      const photoUrls = await searchWikimediaImages(venue.name);

      // Rate limit: 1 request per second (Wikimedia requirement)
      await sleep(1000);

      if (photoUrls.length === 0) {
        console.log(`   ⚠️  No images found in Wikimedia Commons`);
        failed++;
        continue;
      }

      console.log(`   ✅ Found ${photoUrls.length} image(s)`);

      // Update venue with photo URLs
      const { error: updateError } = await supabase
        .from('venues')
        .update({ photo_keys: photoUrls })
        .eq('id', venue.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   💾 Updated successfully`);
        success++;
      }

    } catch (e) {
      console.log(`   ❌ Error: ${e}`);
      failed++;
    }
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('   COMPLETE');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`✅ Successfully added: ${success} photos`);
  console.log(`❌ Not found/failed:   ${failed} photos`);
  console.log('');
  console.log(`📊 Photo coverage improved by: ${success} venues`);
  console.log(`   Run check-venues-without-photos.ts to see updated stats\n`);
}

addMissingPhotos();
