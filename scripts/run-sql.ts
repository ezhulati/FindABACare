/**
 * Run SQL via Supabase Management API
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const projectRef = 'gvfkyfzukwnjomksuvaq';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

async function runSQL(sql: string, name: string) {
  console.log(`\n🚀 Running: ${name}...`);

  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    }
  );

  if (response.ok) {
    console.log(`✅ ${name} completed`);
    return true;
  } else {
    const text = await response.text();
    console.log(`⚠️  ${name} response:`, text);
    return false;
  }
}

async function main() {
  console.log('📋 Reading migration files...\n');

  const migrations = [
    {
      file: join(process.cwd(), 'supabase/migrations/add_venue_votes.sql'),
      name: 'Voting System Migration'
    },
    {
      file: join(process.cwd(), 'supabase/migrations/add_profile_fields.sql'),
      name: 'Profile Fields Migration'
    }
  ];

  for (const migration of migrations) {
    const sql = readFileSync(migration.file, 'utf-8');
    await runSQL(sql, migration.name);
  }

  console.log('\n✅ All migrations attempted!');
  console.log('\nNote: Some operations may require manual execution in Supabase Dashboard.');
  console.log('If voting buttons still don\'t work, run the SQL manually at:');
  console.log('https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new');
}

main();
