import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function applyMigration() {
  console.log('🚀 Applying database migration via SQL...\n');

  const statements = [
    // Venues table - new columns
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_place_id TEXT",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual'",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1)",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1)",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_review_count INTEGER",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_open_now BOOLEAN",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS hours JSONB",
    "ALTER TABLE venues ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP",

    // Cities table - new columns
    "ALTER TABLE cities ADD COLUMN IF NOT EXISTS priority_tier INTEGER DEFAULT 3",
    "ALTER TABLE cities ADD COLUMN IF NOT EXISTS population INTEGER",
    "ALTER TABLE cities ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT FALSE",

    // Indexes
    "CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON venues(google_place_id)",
    "CREATE INDEX IF NOT EXISTS idx_venues_verification_status ON venues(verification_status)",
    "CREATE INDEX IF NOT EXISTS idx_venues_data_source ON venues(data_source)",
  ];

  try {
    // Execute SQL statements using fetch to REST API
    for (const sql of statements) {
      console.log(`Executing: ${sql.substring(0, 80)}...`);

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`   ⚠️  ${error}\n`);
      } else {
        console.log('   ✅\n');
      }
    }

    // Now update existing data using Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Updating existing venues to admin_verified...');
    const { error: updateError } = await supabase
      .from('venues')
      .update({
        data_source: 'manual',
        verification_status: 'admin_verified'
      })
      .is('data_source', null);

    if (updateError) {
      console.log(`   ⚠️  ${updateError.message}\n`);
    } else {
      console.log('   ✅\n');
    }

    console.log('Updating Dallas and Houston to tier 1...');
    const { error: tier1Error } = await supabase
      .from('cities')
      .update({
        priority_tier: 1,
        auto_sync_enabled: true
      })
      .in('slug', ['dallas', 'houston']);

    if (tier1Error) {
      console.log(`   ⚠️  ${tier1Error.message}\n`);
    } else {
      console.log('   ✅\n');
    }

    console.log('✅ Migration complete!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyMigration();
