#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

/**
 * Fix ALL venues with broken relative photo paths by setting photo_keys to null
 * This will make them show the placeholder image instead of broken images
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixAllBrokenPhotos() {
  console.log('🔧 Fixing ALL venues with broken relative photo paths...\n');

  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  let totalFixed = 0;

  while (hasMore) {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, photo_keys')
      .not('photo_keys', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching venues:', error);
      break;
    }

    if (!venues || venues.length === 0) {
      hasMore = false;
      break;
    }

    // Find venues with broken paths in this batch
    const brokenVenues = venues.filter(venue => {
      if (venue.photo_keys && Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
        const firstPhoto = venue.photo_keys[0];
        return firstPhoto.startsWith('/venue-photos/');
      }
      return false;
    });

    // Fix them in batch
    if (brokenVenues.length > 0) {
      console.log(`   Processing batch at offset ${offset}... Found ${brokenVenues.length} to fix`);

      for (const venue of brokenVenues) {
        const { error: updateError } = await supabase
          .from('venues')
          .update({ photo_keys: null })
          .eq('id', venue.id);

        if (updateError) {
          console.log(`   ❌ Error fixing ${venue.name}: ${updateError.message}`);
        } else {
          totalFixed++;
          if (totalFixed % 100 === 0) {
            console.log(`      ✅ Fixed ${totalFixed} venues so far...`);
          }
        }
      }
    }

    if (venues.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`✅ COMPLETE!`);
  console.log(`   Total venues fixed: ${totalFixed}`);
  console.log(`   These venues will now show placeholder images`);
  console.log('════════════════════════════════════════════════\n');
}

fixAllBrokenPhotos();
