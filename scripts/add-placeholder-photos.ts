import { createClient } from '@supabase/supabase-js';

/**
 * Add placeholder photos to venues based on their type
 * Run with: npx tsx scripts/add-placeholder-photos.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// High-quality Unsplash photos for each venue type
const photosByType: Record<string, string[]> = {
  museum: [
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80', // Science museum
    'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80', // Museum interior
    'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80', // Children at museum
  ],
  library: [
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80', // Modern library
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // Library shelves
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80', // Reading area
  ],
  park: [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', // Beautiful park
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&q=80', // Playground
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80', // Green space
  ],
  gym: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', // Indoor gym
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80', // Kids playing
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80', // Activity space
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', // Restaurant interior
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', // Family dining
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', // Food service
  ],
  theater: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80', // Theater seats
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80', // Movie theater
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80', // Theater interior
  ],
};

async function addPlaceholderPhotos() {
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'active')
    .is('photo_keys', null);

  if (error || !venues) {
    console.error('Error fetching venues:', error);
    process.exit(1);
  }

  console.log(`Found ${venues.length} venues without photos\n`);

  for (const venue of venues) {
    const venueType = venue.type || 'park';
    const photos = photosByType[venueType] || photosByType['park'];

    console.log(`📍 ${venue.name}`);
    console.log(`   Type: ${venueType}`);
    console.log(`   Adding ${photos.length} placeholder photos`);

    const { error: updateError } = await supabase
      .from('venues')
      .update({ photo_keys: photos })
      .eq('id', venue.id);

    if (updateError) {
      console.log(`   ❌ Error:`, updateError.message);
    } else {
      console.log(`   ✅ Photos added\n`);
    }
  }

  console.log('🎉 Placeholder photos complete!');
  process.exit(0);
}

addPlaceholderPhotos();
