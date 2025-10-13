/**
 * API Endpoint to Run Favorites Migration
 *
 * This is a one-time endpoint to apply the favorites table migration.
 * Uses Supabase Management API with service role key to execute SQL.
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Security: Only allow from localhost in development
    if (process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({
        error: 'Migration endpoint disabled in production'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({
        error: 'Missing Supabase credentials'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Running favorites migration via Supabase SQL API...');

    // Execute SQL via Supabase's SQL endpoint
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

    const results = [];

    for (const query of queries) {
      const shortQuery = query.substring(0, 60).replace(/\s+/g, ' ');
      console.log(`📝 Executing: ${shortQuery}...`);

      try {
        // Use Supabase PostgREST to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ query })
        });

        if (response.ok) {
          console.log('   ✅ Success');
          results.push({ query: shortQuery, success: true });
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  ${errorText}`);
          results.push({ query: shortQuery, success: false, error: errorText });
        }
      } catch (error: any) {
        console.error(`   ❌ Error:`, error.message);
        results.push({ query: shortQuery, success: false, error: error.message });
      }
    }

    // Test that the table was created
    console.log('\n🧪 Testing table creation...');
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/venue_favorites?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });

    if (testResponse.ok) {
      console.log('✅ Table is accessible!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Favorites migration completed',
        results
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const errorText = await testResponse.text();
      console.error('❌ Table test failed:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Migration may have failed - table not accessible',
        results
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      detail: error.detail
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
