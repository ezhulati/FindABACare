import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPhotoCoverage() {
  console.log('🔍 Checking photo coverage...\n');

  // Get total venues
  const { count: totalCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });

  // Get venues with photos
  const { count: withPhotos } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .not('photo_keys', 'is', null);

  // Get venues without photos
  const { count: withoutPhotos } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .is('photo_keys', null);

  console.log('════════════════════════════════════════════════');
  console.log('   PHOTO COVERAGE STATS');
  console.log('════════════════════════════════════════════════');
  console.log(`Total venues:        ${totalCount}`);
  console.log(`With photos:         ${withPhotos} (${((withPhotos! / totalCount!) * 100).toFixed(1)}%)`);
  console.log(`Without photos:      ${withoutPhotos} (${((withoutPhotos! / totalCount!) * 100).toFixed(1)}%)`);
  console.log('');

  // Sample 10 venues without photos
  const { data: samplesWithout } = await supabase
    .from('venues')
    .select('id, name, slug, data_source')
    .is('photo_keys', null)
    .limit(10);

  console.log('📸 Sample venues WITHOUT photos:');
  samplesWithout?.forEach((v, i) => {
    console.log(`   ${i+1}. ${v.name} (${v.data_source || 'unknown'})`);
  });
}

checkPhotoCoverage();
