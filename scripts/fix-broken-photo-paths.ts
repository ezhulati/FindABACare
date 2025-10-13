#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

/**
 * Fix broken photo paths by setting them to null for venues with invalid photos
 * These venues have placeholder paths that don't actually exist in Supabase Storage
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixBrokenPhotoPaths() {
  console.log('🔍 Finding venues with broken photo paths...\n');

  // Get all venues with photo_keys that start with /venue-photos/
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, photo_keys')
    .not('photo_keys', 'is', null);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  let fixed = 0;
  let valid = 0;

  for (const venue of venues || []) {
    if (venue.photo_keys && venue.photo_keys.length > 0) {
      const firstPhoto = venue.photo_keys[0];

      // Check if it's a relative path (starts with /)
      if (firstPhoto.startsWith('/venue-photos/')) {
        console.log(`🔧 Fixing: ${venue.name}`);
        console.log(`   Old: ${firstPhoto}`);

        // Set photo_keys to null for venues with invalid placeholder paths
        const { error: updateError } = await supabase
          .from('venues')
          .update({ photo_keys: null })
          .eq('id', venue.id);

        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`);
        } else {
          console.log(`   ✅ Set to null (will show placeholder)\n`);
          fixed++;
        }
      } else {
        valid++;
      }
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`✅ Fixed: ${fixed} venues`);
  console.log(`📷 Valid photos: ${valid} venues`);
  console.log('════════════════════════════════════════════════\n');
}

fixBrokenPhotoPaths();
