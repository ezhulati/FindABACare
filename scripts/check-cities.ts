/**
 * Check which cities exist in the database
 * Usage: SUPABASE_SERVICE_ROLE_KEY="xxx" npx tsx scripts/check-cities.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCities() {
  console.log('🔍 Checking cities in database...\n');

  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name, slug, state, status')
      .order('name');

    if (error) throw error;

    if (!cities || cities.length === 0) {
      console.log('⚠️  No cities found in database');
      return;
    }

    console.log(`✅ Found ${cities.length} cities:\n`);

    cities.forEach((city) => {
      console.log(`  ${city.name}, ${city.state}`);
      console.log(`    → slug: "${city.slug}"`);
      console.log(`    → id: ${city.id}`);
      console.log(`    → status: ${city.status}`);
      console.log('');
    });

    // Check specifically for Dallas
    const dallas = cities.find(c =>
      c.name.toLowerCase() === 'dallas' ||
      c.slug.toLowerCase().includes('dallas')
    );

    if (dallas) {
      console.log('✅ Dallas found:');
      console.log(`   Name: ${dallas.name}`);
      console.log(`   Slug: "${dallas.slug}"`);
      console.log(`   ID: ${dallas.id}`);
      console.log(`   State: ${dallas.state}`);
    } else {
      console.log('❌ Dallas not found in cities list');
    }

  } catch (error: any) {
    console.error('❌ Error checking cities:', error.message);
    process.exit(1);
  }
}

checkCities();
