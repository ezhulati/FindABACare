import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPhotoUrls() {
  console.log('🔍 Checking photo URLs...\n');

  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, photo_keys')
    .not('photo_keys', 'is', null)
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${venues?.length || 0} venues with photo_keys\n`);

  let validUrls = 0;
  let invalidUrls = 0;
  let nullUrls = 0;

  for (const venue of venues || []) {
    console.log(`\n📍 ${venue.name}`);

    if (!venue.photo_keys) {
      console.log('   ⚠️  NULL');
      nullUrls++;
      continue;
    }

    // photo_keys might be a string (comma-separated) or array
    let urls: string[] = [];
    if (typeof venue.photo_keys === 'string') {
      console.log(`   photo_keys (string): ${venue.photo_keys.substring(0, 100)}...`);
      urls = venue.photo_keys.split(',').map((u: string) => u.trim());
    } else if (Array.isArray(venue.photo_keys)) {
      console.log(`   photo_keys (array): ${venue.photo_keys.length} items`);
      urls = venue.photo_keys;
    } else {
      console.log(`   photo_keys type: ${typeof venue.photo_keys}`);
      console.log(`   photo_keys value:`, JSON.stringify(venue.photo_keys));
      continue;
    }

    console.log(`   Found ${urls.length} URL(s)`);

    for (const url of urls) {
      // Test if URL is accessible
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ ${url.substring(0, 60)}... (${response.status})`);
          validUrls++;
        } else {
          console.log(`   ❌ ${url.substring(0, 60)}... (${response.status})`);
          invalidUrls++;
        }
      } catch (e) {
        console.log(`   ❌ ${url.substring(0, 60)}... (fetch failed)`);
        invalidUrls++;
      }
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('════════════════════════════════════════════════');
  console.log(`✅ Valid URLs:   ${validUrls}`);
  console.log(`❌ Invalid URLs: ${invalidUrls}`);
  console.log(`⚠️  Null values: ${nullUrls}`);
  console.log('');
}

testPhotoUrls();
