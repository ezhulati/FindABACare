/**
 * Update Supabase Auth redirect URLs to include autism.place
 * Run with: npx tsx scripts/update-supabase-auth-urls.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAuthConfig() {
  console.log('🔧 Updating Supabase Auth configuration...\n');

  // Note: Auth configuration must be updated via Supabase Dashboard
  // This script provides the URLs you need to add

  const redirectURLs = [
    'http://localhost:4321/auth/callback',
    'http://localhost:3000/auth/callback',
    'https://autism.place/auth/callback',
    'https://www.autism.place/auth/callback',
    'https://findaba.care/auth/callback', // Keep old domain during transition
    'https://www.findaba.care/auth/callback',
  ];

  const additionalRedirectURLs = [
    'http://localhost:4321/**',
    'http://localhost:3000/**',
    'https://autism.place/**',
    'https://www.autism.place/**',
    'https://findaba.care/**', // Keep old domain during transition
    'https://www.findaba.care/**',
  ];

  console.log('📋 Add these URLs to Supabase Auth configuration:');
  console.log('\n🔗 Redirect URLs:');
  redirectURLs.forEach(url => console.log(`  ✓ ${url}`));

  console.log('\n🔗 Additional Redirect URLs (wildcard):');
  additionalRedirectURLs.forEach(url => console.log(`  ✓ ${url}`));

  console.log('\n\n📍 How to update:');
  console.log('1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/auth/url-configuration');
  console.log('2. Add the URLs above to "Redirect URLs"');
  console.log('3. Save configuration\n');

  console.log('✅ Configuration URLs ready!\n');
}

updateAuthConfig();
