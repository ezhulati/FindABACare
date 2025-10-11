import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  try {
    // Step 1: Add columns to venues table using individual ALTER statements
    console.log('Step 1: Adding columns to venues table...');

    const venueColumns = [
      { name: 'google_place_id', type: 'TEXT' },
      { name: 'data_source', type: 'TEXT', default: "'manual'" },
      { name: 'verification_status', type: 'TEXT', default: "'unverified'" },
      { name: 'review_count', type: 'INTEGER', default: '0' },
      { name: 'average_rating', type: 'DECIMAL(2,1)' },
      { name: 'google_rating', type: 'DECIMAL(2,1)' },
      { name: 'google_review_count', type: 'INTEGER' },
      { name: 'is_open_now', type: 'BOOLEAN' },
      { name: 'hours', type: 'JSONB' },
      { name: 'last_synced_at', type: 'TIMESTAMP' }
    ];

    for (const col of venueColumns) {
      console.log(`  Adding ${col.name}...`);
      // We'll verify by trying to query with this column
      const { error } = await supabase
        .from('venues')
        .select(col.name)
        .limit(0);

      if (error && error.message.includes('column')) {
        console.log(`    Column doesn't exist yet - needs manual migration`);
      } else {
        console.log(`    ✅ Already exists or accessible`);
      }
    }

    // Step 2: Add columns to cities table
    console.log('\nStep 2: Adding columns to cities table...');

    const cityColumns = [
      { name: 'priority_tier', type: 'INTEGER' },
      { name: 'population', type: 'INTEGER' },
      { name: 'auto_sync_enabled', type: 'BOOLEAN' }
    ];

    for (const col of cityColumns) {
      console.log(`  Checking ${col.name}...`);
      const { error } = await supabase
        .from('cities')
        .select(col.name)
        .limit(0);

      if (error && error.message.includes('column')) {
        console.log(`    Column doesn't exist yet - needs manual migration`);
      } else {
        console.log(`    ✅ Already exists or accessible`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('⚠️  MANUAL MIGRATION REQUIRED');
    console.log('='.repeat(70));
    console.log('\nSupabase doesn\'t allow ALTER TABLE via the REST API.');
    console.log('Please run the SQL migration manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/20251011_add_national_coverage_columns.sql');
    console.log('3. Paste and click "Run"\n');
    console.log('After running the migration, re-run this script to verify.\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
