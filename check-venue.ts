import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  console.log('Searching for "Calm Windows" venue...\n');

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, slug, status, city_id')
    .ilike('name', '%calm%windows%')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Venues found:', JSON.stringify(data, null, 2));

  if (data && data.length > 0) {
    const slug = data[0].slug;
    console.log('\n---\nChecking venue by slug:', slug);

    const { data: bySlug, error: slugError } = await supabase
      .from('venues')
      .select('id, name, slug, status')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (slugError) {
      console.log('Error fetching by slug:', slugError);
    } else {
      console.log('Result:', JSON.stringify(bySlug, null, 2));
    }
  }
})();
