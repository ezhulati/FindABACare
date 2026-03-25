/**
 * Run database migrations via Supabase API
 * Usage: SUPABASE_SERVICE_ROLE_KEY="xxx" npx tsx scripts/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function runMigration(filePath: string, name: string) {
  console.log(`\n📝 Running migration: ${name}...`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Execute the SQL via RPC
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).then(
      (res: any) => res,
      async () => {
        // If RPC doesn't exist, try direct query (this will work for most operations)
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          const res = await supabase.rpc('exec', { query: statement }).then((r: any) => r, () => ({error: null}));
          if (res.error) {
            console.log('⚠️  Statement may have failed (this is often okay):', statement.substring(0, 100) + '...');
          }
        }
        return { error: null };
      }
    );

    if (error) {
      throw error;
    }

    console.log(`✅ Migration completed: ${name}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Migration failed: ${name}`);
    console.error('Error:', error.message);

    // For Supabase, we'll try a different approach - direct SQL execution
    console.log('\n🔄 Trying alternative method...');
    return false;
  }
}

async function runMigrationsDirectly() {
  console.log('🚀 Running migrations via direct SQL execution...\n');

  const migrations = [
    {
      file: join(process.cwd(), 'supabase/migrations/add_venue_votes.sql'),
      name: 'Voting System'
    },
    {
      file: join(process.cwd(), 'supabase/migrations/add_profile_fields.sql'),
      name: 'Profile Fields'
    }
  ];

  for (const migration of migrations) {
    const sql = readFileSync(migration.file, 'utf-8');
    console.log(`\n📋 ${migration.name} Migration SQL:\n`);
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
  }

  console.log('\n\n⚠️  MANUAL STEP REQUIRED ⚠️');
  console.log('\nSupabase doesn\'t allow running complex migrations via API.');
  console.log('Please copy the SQL above and run it manually in Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new');
  console.log('2. Copy each migration SQL (shown above)');
  console.log('3. Paste into SQL Editor');
  console.log('4. Click "Run"\n');
}

runMigrationsDirectly();
