#!/usr/bin/env tsx
/**
 * Apply favorites migration - Simple version using Supabase Admin client
 * Run with: SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/apply-favorites-migration-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Run with: SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/apply-favorites-migration-simple.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Applying favorites migration...\\n');

  try {
    // First, check if table already exists
    const { data: existing, error: checkError } = await supabase
      .from('venue_favorites')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Table venue_favorites already exists!');
      console.log('\\nMigration appears to already be applied.');
      return;
    }

    console.log('📋 Table does not exist yet. Please apply the migration manually:\\n');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq');
    console.log('2. Go to SQL Editor');
    console.log('3. Paste the contents of: supabase/migrations/20251013_add_favorites.sql');
    console.log('4. Click RUN\\n');

    console.log('OR copy and paste this SQL:\\n');
    console.log('----------------------------------------');

    const fs = await import('fs');
    const sql = fs.readFileSync('supabase/migrations/20251013_add_favorites.sql', 'utf-8');
    console.log(sql);
    console.log('----------------------------------------\\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
