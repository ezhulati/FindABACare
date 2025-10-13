#!/usr/bin/env tsx
/**
 * Apply favorites migration using pg client directly
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';

const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const client = new Client({
  connectionString: `postgresql://postgres.gvfkyfzukwnjomksuvaq:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🚀 Running favorites migration...\n');

    const sql = readFileSync('supabase/migrations/20251013_add_favorites.sql', 'utf-8');

    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Test that it worked
    console.log('🧪 Testing table...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'venue_favorites'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table created successfully!');
      console.log('\nColumns:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Table may not have been created');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
