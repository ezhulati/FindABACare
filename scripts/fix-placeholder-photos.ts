#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

/**
 * Fix venues that have placeholder photo paths (/venue-photos/...)
 * that don't actually exist in Supabase Storage.
 * Sets photo_keys to null so the placeholder image will show instead.
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixPlaceholderPhotos() {
  console.log('🔍 Finding venues with placeholder photo paths...\n');

  // Get all venues
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, photo_keys')
    .not('photo_keys', 'is', null);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  let fixed = 0;
  const brokenVenues: any[] = [];

  // Check each venue's photos
  for (const venue of venues || []) {
    if (venue.photo_keys && Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
      const firstPhoto = venue.photo_keys[0];

      // If it's a relative path starting with /venue-photos/, these don't exist in storage
      if (firstPhoto.startsWith('/venue-photos/')) {
        brokenVenues.push({
          id: venue.id,
          name: venue.name,
          path: firstPhoto
        });
      }
    }
  }

  console.log(`Found ${brokenVenues.length} venues with broken placeholder photos\n`);

  if (brokenVenues.length === 0) {
    console.log('✅ No broken photos found!');
    return;
  }

  console.log('Sample venues to fix:');
  brokenVenues.slice(0, 10).forEach(v => {
    console.log(`  - ${v.name}`);
  });

  console.log(`\n🔧 Fixing ${brokenVenues.length} venues...\n`);

  // Fix them by setting photo_keys to null
  for (const venue of brokenVenues) {
    const { error: updateError } = await supabase
      .from('venues')
      .update({ photo_keys: null })
      .eq('id', venue.id);

    if (updateError) {
      console.log(`❌ Error fixing ${venue.name}: ${updateError.message}`);
    } else {
      fixed++;
      if (fixed % 50 === 0) {
        console.log(`   ✅ Fixed ${fixed} venues...`);
      }
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`✅ Fixed ${fixed} venues`);
  console.log(`   These venues will now show the placeholder image`);
  console.log('════════════════════════════════════════════════\n');
}

fixPlaceholderPhotos();
