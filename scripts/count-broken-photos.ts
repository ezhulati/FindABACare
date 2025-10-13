#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function countBrokenPhotos() {
  console.log('🔍 Counting venues with different photo path types...\n');

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });

  console.log(`Total venues in database: ${totalCount}\n`);

  // Sample venues with photos
  const { data: sampleVenues, error } = await supabase
    .from('venues')
    .select('id, name, photo_keys')
    .not('photo_keys', 'is', null)
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample of first 20 venues with photo_keys:\n');

  for (const venue of sampleVenues || []) {
    if (venue.photo_keys && Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
      const firstPhoto = venue.photo_keys[0];
      const type = firstPhoto.startsWith('/venue-photos/') ? 'RELATIVE PATH' :
                   firstPhoto.startsWith('http') ? 'FULL URL' : 'OTHER';

      console.log(`${type}: ${venue.name}`);
      console.log(`  Path: ${firstPhoto}\n`);
    }
  }
}

countBrokenPhotos();
