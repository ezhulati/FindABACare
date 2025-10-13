import { createClient } from '@supabase/supabase-js';

/**
 * Backfill existing venues with contact information from Google Places API
 * Run with: npx tsx scripts/backfill-venue-details.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

if (!supabaseServiceKey || !googleApiKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY, GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PlaceDetails {
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    periods?: any[];
    weekday_text?: string[];
  };
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number,website,opening_hours,price_level,rating,user_ratings_total&key=${googleApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result;
    }

    if (data.status !== 'OK') {
      console.error(`      ⚠️  API error: ${data.status}`);
    }
  } catch (error) {
    console.error(`      ❌ Fetch error:`, error);
  }

  return null;
}

async function backfillVenueDetails() {
  console.log('🚀 Starting venue details backfill...\n');

  // Fetch all venues with google_place_id that don't have phone or website yet
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, google_place_id, phone, website')
    .not('google_place_id', 'is', null)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching venues:', error);
    process.exit(1);
  }

  if (!venues || venues.length === 0) {
    console.log('✅ No venues to backfill!');
    process.exit(0);
  }

  // Filter to only venues missing data
  const venuesNeedingUpdate = venues.filter(v => !v.phone && !v.website);

  console.log(`📊 Found ${venues.length} total venues`);
  console.log(`📋 ${venuesNeedingUpdate.length} need contact info updates\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const venue of venuesNeedingUpdate) {
    console.log(`\n[${updated + skipped + failed + 1}/${venuesNeedingUpdate.length}] ${venue.name}`);
    console.log(`   🔍 Fetching details for place_id: ${venue.google_place_id}`);

    const details = await getPlaceDetails(venue.google_place_id);

    if (!details) {
      console.log('   ⏭️  No details found, skipping...');
      skipped++;
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    // Build update object
    const updates: any = {
      phone: details.international_phone_number || null,
      formatted_phone_number: details.formatted_phone_number || null,
      website: details.website || null,
      price_level: details.price_level ?? null,
      google_rating: details.rating || null,
      google_review_count: details.user_ratings_total || null,
      hours: details.opening_hours ? {
        periods: details.opening_hours.periods || [],
        weekday_text: details.opening_hours.weekday_text || []
      } : null,
    };

    // Log what we found
    const foundItems = [];
    if (updates.phone) foundItems.push('📞 phone');
    if (updates.website) foundItems.push('🌐 website');
    if (updates.hours) foundItems.push('🕐 hours');
    if (updates.price_level !== null) foundItems.push('💵 price');
    if (updates.google_rating) foundItems.push(`⭐ ${updates.google_rating}/5`);

    if (foundItems.length === 0) {
      console.log('   ⏭️  No new data, skipping...');
      skipped++;
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    console.log(`   ✓ Found: ${foundItems.join(', ')}`);

    // Update venue
    const { error: updateError } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', venue.id);

    if (updateError) {
      console.error(`   ❌ Update failed:`, updateError.message);
      failed++;
    } else {
      console.log('   ✅ Updated successfully');
      updated++;
    }

    // Rate limiting - be nice to Google API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n\n📊 Backfill Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${venuesNeedingUpdate.length}`);
  console.log('\n🎉 Backfill complete!\n');
}

backfillVenueDetails();
