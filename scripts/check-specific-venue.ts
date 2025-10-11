import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const { data, error } = await supabase
  .from('venues')
  .select('id, name, address, photo_keys, slug')
  .ilike('address', '%8008 Cedar Springs%');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Found venues:', data);
  data?.forEach(venue => {
    console.log('\nVenue:', venue.name);
    console.log('Address:', venue.address);
    console.log('Slug:', venue.slug);
    console.log('Photo keys:', venue.photo_keys);
    console.log('Photo count:', venue.photo_keys?.length || 0);
  });
}
