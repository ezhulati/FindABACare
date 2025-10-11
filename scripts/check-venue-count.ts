import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkVenues() {
  // Count all venues
  const { count: totalCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });

  // Count manual venues
  const { count: manualCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'manual');

  // Count Google Places venues
  const { count: googleCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'google_places');

  // Get sample of new venues
  const { data: samples } = await supabase
    .from('venues')
    .select('name, type, google_rating, data_source')
    .eq('data_source', 'google_places')
    .limit(10);

  console.log('\n📊 Venue Database Stats:\n');
  console.log(`Total venues: ${totalCount}`);
  console.log(`  ├─ Manual (existing): ${manualCount}`);
  console.log(`  └─ Google Places (new): ${googleCount}\n`);

  if (samples && samples.length > 0) {
    console.log('🔍 Sample of new Google Places venues:\n');
    samples.forEach((v, i) => {
      console.log(`${i + 1}. ${v.name} (${v.type}) - ⭐ ${v.google_rating || 'N/A'}`);
    });
  }

  console.log('');
}

checkVenues();
