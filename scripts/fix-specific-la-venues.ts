#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

/**
 * Fix the specific LA venues that have broken relative photo paths
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixSpecificLAVenues() {
  console.log('🔧 Fixing specific LA venues with broken photos...\n');

  const venueIDs = [
    'c5a2afdd-c135-48b3-bb2c-75d71fbbd64f', // 109th Street Pool
    '4605963b-96cc-4b8b-9e3f-3f3c442d5142', // 109th Street Recreation Center
    '4f3b3a56-375e-4cbf-9cb9-60a27bae79d0', // 11 To 7 Kids Palace
    '20732fe9-37f2-49b9-8467-d5c6f45a028c'  // 24 Hour Fitness
  ];

  let fixed = 0;

  for (const id of venueIDs) {
    // Get the venue
    const { data: venue, error: fetchError } = await supabase
      .from('venues')
      .select('id, name, photo_keys')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.log(`❌ Error fetching venue ${id}: ${fetchError.message}`);
      continue;
    }

    if (!venue) {
      console.log(`❌ Venue not found: ${id}`);
      continue;
    }

    console.log(`\n📍 ${venue.name}`);
    console.log(`   Current photo_keys: ${JSON.stringify(venue.photo_keys)}`);

    if (venue.photo_keys && Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
      const firstPhoto = venue.photo_keys[0];

      if (firstPhoto.startsWith('/venue-photos/')) {
        console.log(`   ⚠️  Has broken relative path`);
        console.log(`   🔧 Setting photo_keys to null...`);

        const { error: updateError } = await supabase
          .from('venues')
          .update({ photo_keys: null })
          .eq('id', id);

        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`);
        } else {
          console.log(`   ✅ Fixed! Will now show placeholder image`);
          fixed++;
        }
      } else {
        console.log(`   ℹ️  Photo already has full URL, no fix needed`);
      }
    } else {
      console.log(`   ℹ️  No photos, already showing placeholder`);
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`✅ Fixed ${fixed} venues`);
  console.log('════════════════════════════════════════════════\n');
}

fixSpecificLAVenues();
