import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Count venues with null photo_keys
const { data: nullPhotos, error: nullError } = await supabase
  .from('venues')
  .select('id, name, slug', { count: 'exact', head: false })
  .is('photo_keys', null)
  .eq('status', 'active');

// Count venues with empty array photo_keys
const { data: emptyPhotos, error: emptyError } = await supabase
  .from('venues')
  .select('id, name, slug')
  .eq('photo_keys', '[]')
  .eq('status', 'active');

// Count total active venues
const { count: total, error: totalError } = await supabase
  .from('venues')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');

console.log('\n📊 Photo Status Summary:');
console.log('='.repeat(50));
console.log(`Total active venues: ${total}`);
console.log(`Venues with NULL photo_keys: ${nullPhotos?.length || 0}`);
console.log(`Venues with empty [] photo_keys: ${emptyPhotos?.length || 0}`);
console.log(`Venues with photos: ${total! - (nullPhotos?.length || 0) - (emptyPhotos?.length || 0)}`);

if (nullPhotos && nullPhotos.length > 0) {
  console.log('\n📍 Venues with NULL photo_keys (first 20):');
  console.log('='.repeat(50));
  nullPhotos.slice(0, 20).forEach((venue, i) => {
    console.log(`${i + 1}. ${venue.name}`);
  });
  if (nullPhotos.length > 20) {
    console.log(`... and ${nullPhotos.length - 20} more`);
  }
}
