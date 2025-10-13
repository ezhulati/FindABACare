#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function findAllBrokenPhotos() {
  console.log('🔍 Searching for ALL venues with broken relative photo paths...\n');

  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  const brokenVenues: any[] = [];

  while (hasMore) {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, slug, photo_keys')
      .not('photo_keys', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('❌ Error:', error);
      break;
    }

    if (!venues || venues.length === 0) {
      hasMore = false;
      break;
    }

    // Check each venue for relative paths
    for (const venue of venues) {
      if (venue.photo_keys && Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
        const firstPhoto = venue.photo_keys[0];
        if (firstPhoto.startsWith('/venue-photos/')) {
          brokenVenues.push({
            id: venue.id,
            name: venue.name,
            slug: venue.slug,
            path: firstPhoto
          });
        }
      }
    }

    console.log(`   Checked ${offset + venues.length} venues... Found ${brokenVenues.length} with broken paths`);

    if (venues.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`\n📊 RESULTS:`);
  console.log(`   Total venues scanned: ${offset}`);
  console.log(`   Venues with broken relative paths: ${brokenVenues.length}\n`);

  if (brokenVenues.length > 0) {
    console.log('Sample of venues with broken paths (first 20):');
    brokenVenues.slice(0, 20).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.name} (${v.slug})`);
      console.log(`     Path: ${v.path}`);
    });

    console.log(`\n💡 To fix these, run:`);
    console.log(`   npx tsx scripts/fix-all-broken-photos.ts`);
  } else {
    console.log('✅ No broken photos found!');
  }

  console.log('════════════════════════════════════════════════\n');
}

findAllBrokenPhotos();
