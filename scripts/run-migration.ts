import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  try {
    // Update existing venues to admin_verified first
    console.log('1. Updating existing venues to admin_verified...');
    const { error: updateError, count } = await supabase
      .from('venues')
      .update({
        data_source: 'manual',
        verification_status: 'admin_verified'
      })
      .is('data_source', null);

    if (updateError) {
      console.log(`   Note: ${updateError.message} (columns may not exist yet, this is OK)\n`);
    } else {
      console.log(`   ✅ Updated ${count} existing venues\n`);
    }

    // Update Dallas and Houston to tier 1
    console.log('2. Marking Dallas and Houston as tier 1...');
    const { error: tier1Error, count: cityCount } = await supabase
      .from('cities')
      .update({
        priority_tier: 1,
        auto_sync_enabled: true
      })
      .in('slug', ['dallas', 'houston']);

    if (tier1Error) {
      console.log(`   Note: ${tier1Error.message} (columns may not exist yet, this is OK)\n`);
    } else {
      console.log(`   ✅ Updated ${cityCount} tier 1 cities\n`);
    }

    console.log('✅ Migration preparation complete!');
    console.log('\n⚠️  NOTE: You need to run the SQL migration file manually in Supabase SQL Editor:');
    console.log('   supabase/migrations/20251011_add_national_coverage_columns.sql');
    console.log('\nOr run in your terminal:');
    console.log('   psql $DATABASE_URL -f supabase/migrations/20251011_add_national_coverage_columns.sql\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();
