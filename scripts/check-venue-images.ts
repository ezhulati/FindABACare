import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkVenueImages() {
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, photo_keys')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }

  console.log('Venue Image Status:');
  console.log('===================\n');

  const withImages = venues?.filter(v => v.photo_keys && v.photo_keys.length > 0) || [];
  const withoutImages = venues?.filter(v => !v.photo_keys || v.photo_keys.length === 0) || [];

  console.log(`Total venues: ${venues?.length || 0}`);
  console.log(`With images: ${withImages.length}`);
  console.log(`Without images: ${withoutImages.length}\n`);

  if (withoutImages.length > 0) {
    console.log('Venues WITHOUT images:');
    console.log('=====================');
    withoutImages.forEach(venue => {
      console.log(`- ${venue.name} (${venue.slug})`);
    });
    console.log('');
  }

  if (withImages.length > 0) {
    console.log('Venues WITH images (sample):');
    console.log('============================');
    withImages.slice(0, 5).forEach(venue => {
      console.log(`${venue.name}:`);
      console.log(`  photo_keys: ${JSON.stringify(venue.photo_keys)}`);
    });
  }
}

checkVenueImages();
