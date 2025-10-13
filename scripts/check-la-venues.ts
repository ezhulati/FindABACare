#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkLAVenues() {
  // Check the specific venues shown in screenshot
  const venueNames = ['109th Street Pool', '109th Street Recreation Center', '1 To 7 Kids Palace', '24 Hour Fitness'];

  for (const name of venueNames) {
    const { data } = await supabase
      .from('venues')
      .select('id, name, photo_keys')
      .ilike('name', `%${name}%`)
      .limit(1);

    if (data && data[0]) {
      console.log(`\n${data[0].name}:`);
      console.log('Photo keys:', data[0].photo_keys);

      if (data[0].photo_keys && data[0].photo_keys.length > 0) {
        console.log('First photo:', data[0].photo_keys[0]);
      }
    }
  }
}

checkLAVenues();
