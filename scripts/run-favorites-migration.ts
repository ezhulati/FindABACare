#!/usr/bin/env tsx
/**
 * Run favorites migration directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running favorites migration...\n');

  const queries = [
    // Create favorites table
    `CREATE TABLE IF NOT EXISTS venue_favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(profile_id, venue_id)
    );`,

    // Add indexes
    `CREATE INDEX IF NOT EXISTS idx_venue_favorites_profile ON venue_favorites(profile_id);`,
    `CREATE INDEX IF NOT EXISTS idx_venue_favorites_venue ON venue_favorites(venue_id);`,

    // Enable RLS
    `ALTER TABLE venue_favorites ENABLE ROW LEVEL SECURITY;`,

    // Drop existing policies if they exist
    `DROP POLICY IF EXISTS "Anyone can view favorites" ON venue_favorites;`,
    `DROP POLICY IF EXISTS "Users can favorite venues" ON venue_favorites;`,
    `DROP POLICY IF EXISTS "Users can unfavorite venues" ON venue_favorites;`,

    // Create RLS policies
    `CREATE POLICY "Anyone can view favorites"
      ON venue_favorites FOR SELECT
      USING (true);`,

    `CREATE POLICY "Users can favorite venues"
      ON venue_favorites FOR INSERT
      WITH CHECK (auth.uid() = profile_id);`,

    `CREATE POLICY "Users can unfavorite venues"
      ON venue_favorites FOR DELETE
      USING (auth.uid() = profile_id);`,

    // Add favorite_count column to venues
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;`,

    // Create or replace function to update favorite count
    `CREATE OR REPLACE FUNCTION update_venue_favorite_count()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE venues
        SET favorite_count = favorite_count + 1
        WHERE id = NEW.venue_id;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE venues
        SET favorite_count = GREATEST(favorite_count - 1, 0)
        WHERE id = OLD.venue_id;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;`,

    // Drop trigger if exists and recreate
    `DROP TRIGGER IF EXISTS trigger_update_favorite_count ON venue_favorites;`,

    `CREATE TRIGGER trigger_update_favorite_count
      AFTER INSERT OR DELETE ON venue_favorites
      FOR EACH ROW
      EXECUTE FUNCTION update_venue_favorite_count();`,
  ];

  for (const query of queries) {
    try {
      const shortQuery = query.substring(0, 60).replace(/\s+/g, ' ');
      console.log(`📝 Executing: ${shortQuery}...`);

      const { error } = await supabase.rpc('exec', { sql: query });

      if (error) {
        // Try direct query execution if RPC fails
        console.log('   ⚠️  RPC failed, trying direct execution...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: query })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   ⚠️  ${errorText}`);
        } else {
          console.log('   ✅ Success (direct)');
        }
      } else {
        console.log('   ✅ Success');
      }
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('\n🧪 Testing table creation...');

  // Test that the table was created
  const { data, error } = await supabase
    .from('venue_favorites')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Table test failed:', error.message);
    console.error('\n⚠️  You may need to run this migration manually via Supabase Dashboard SQL Editor');
  } else {
    console.log('✅ Table is accessible!');
  }
}

runMigration().catch(console.error);
