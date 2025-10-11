import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCities() {
  console.log('Seeding cities to production database...');
  
  const { data, error } = await supabase
    .from('cities')
    .upsert(
      [
        {
          name: 'Dallas',
          state: 'TX',
          slug: 'dallas',
          center_lat: 32.7767,
          center_lng: -96.7970,
          status: 'active',
        },
        {
          name: 'Houston',
          state: 'TX',
          slug: 'houston',
          center_lat: 29.7604,
          center_lng: -95.3698,
          status: 'active',
        },
      ],
      { onConflict: 'slug' }
    )
    .select();

  if (error) {
    console.error('❌ Error seeding cities:', error);
    process.exit(1);
  }

  console.log('✅ Cities seeded successfully!');
  console.log(data);
  process.exit(0);
}

seedCities();
