#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function diagnosePhotoMapping() {
  console.log('🔍 Comprehensive Photo Mapping Diagnosis\n');
  console.log('════════════════════════════════════════════════\n');

  // 1. Check Los Angeles venues specifically
  console.log('1️⃣ CHECKING LOS ANGELES VENUES:');
  const { data: laVenues, error: laError } = await supabase
    .from('venues')
    .select('id, name, slug, photo_keys, city_id')
    .eq('city_id', '550e8400-e29b-41d4-a716-446655440003') // LA city ID
    .order('name')
    .limit(10);

  if (laError) {
    console.error('❌ Error fetching LA venues:', laError);
  } else {
    console.log(`Found ${laVenues?.length} LA venues\n`);
    for (const venue of laVenues || []) {
      console.log(`📍 ${venue.name}`);
      console.log(`   ID: ${venue.id}`);
      console.log(`   Slug: ${venue.slug}`);
      console.log(`   photo_keys type: ${typeof venue.photo_keys}`);
      console.log(`   photo_keys value: ${JSON.stringify(venue.photo_keys)}`);
      console.log(`   Is array: ${Array.isArray(venue.photo_keys)}`);
      if (venue.photo_keys && Array.isArray(venue.photo_keys)) {
        console.log(`   Array length: ${venue.photo_keys.length}`);
        if (venue.photo_keys.length > 0) {
          console.log(`   First photo: ${venue.photo_keys[0]}`);
        }
      }
      console.log('');
    }
  }

  // 2. Check venues with relative paths
  console.log('\n2️⃣ CHECKING VENUES WITH RELATIVE PATHS:');
  const { data: relativePathVenues, error: relError } = await supabase
    .from('venues')
    .select('id, name, photo_keys')
    .not('photo_keys', 'is', null)
    .limit(1000);

  if (relError) {
    console.error('❌ Error:', relError);
  } else {
    let relativeCount = 0;
    let fullUrlCount = 0;
    let nullCount = 0;
    let emptyArrayCount = 0;

    const samples: any[] = [];

    for (const venue of relativePathVenues || []) {
      if (!venue.photo_keys) {
        nullCount++;
      } else if (Array.isArray(venue.photo_keys) && venue.photo_keys.length === 0) {
        emptyArrayCount++;
      } else if (Array.isArray(venue.photo_keys) && venue.photo_keys.length > 0) {
        const firstPhoto = venue.photo_keys[0];
        if (firstPhoto.startsWith('/venue-photos/')) {
          relativeCount++;
          if (samples.length < 5) {
            samples.push({ name: venue.name, path: firstPhoto });
          }
        } else if (firstPhoto.startsWith('http')) {
          fullUrlCount++;
        }
      }
    }

    console.log(`\n📊 Statistics:`);
    console.log(`   Total venues checked: ${relativePathVenues?.length}`);
    console.log(`   Null photo_keys: ${nullCount}`);
    console.log(`   Empty arrays: ${emptyArrayCount}`);
    console.log(`   Relative paths (/venue-photos/): ${relativeCount}`);
    console.log(`   Full URLs (http/https): ${fullUrlCount}`);

    if (samples.length > 0) {
      console.log(`\n📸 Sample venues with relative paths:`);
      for (const sample of samples) {
        console.log(`   - ${sample.name}: ${sample.path}`);
      }
    }
  }

  // 3. Check specific venues from the screenshot
  console.log('\n3️⃣ CHECKING SPECIFIC VENUES FROM SCREENSHOT:');
  const venueNames = [
    '109th Street Pool',
    '109th Street Recreation Center',
    '1 To 7 Kids Palace',
    '24 Hour Fitness'
  ];

  for (const name of venueNames) {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, slug, photo_keys, city_id')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      console.log(`\n❌ ${name}: Not found or error - ${error.message}`);
    } else if (data) {
      console.log(`\n✅ ${data.name}:`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Slug: ${data.slug}`);
      console.log(`   City ID: ${data.city_id}`);
      console.log(`   photo_keys: ${JSON.stringify(data.photo_keys)}`);

      if (data.photo_keys && Array.isArray(data.photo_keys) && data.photo_keys.length > 0) {
        const firstPhoto = data.photo_keys[0];
        console.log(`   First photo path: ${firstPhoto}`);
        console.log(`   Starts with /venue-photos/: ${firstPhoto.startsWith('/venue-photos/')}`);
        console.log(`   Starts with http: ${firstPhoto.startsWith('http')}`);
      }
    }
  }

  console.log('\n════════════════════════════════════════════════');
}

diagnosePhotoMapping();
