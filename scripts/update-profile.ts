/**
 * Script to update existing user profile
 * Usage: SUPABASE_SERVICE_ROLE_KEY="xxx" npx tsx scripts/update-profile.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateProfile() {
  console.log('🔄 Updating profile for enrizhulati@gmail.com...\n');

  try {
    // Find Dallas city ID
    console.log('1️⃣  Looking up Dallas city...');
    const { data: dallasCity, error: cityError } = await supabase
      .from('cities')
      .select('id, name, slug')
      .eq('slug', 'dallas')
      .single();

    if (cityError) {
      console.error('City lookup error:', cityError);
      throw new Error(`Dallas city lookup failed: ${cityError.message}`);
    }

    if (!dallasCity) {
      throw new Error('Dallas city not found in database');
    }

    console.log(`   ✅ Found: ${dallasCity.name} (ID: ${dallasCity.id})\n`);

    // Find user by email
    console.log('2️⃣  Looking up user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'enrizhulati@gmail.com')
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('Profile not found for enrizhulati@gmail.com');
    }

    console.log(`   ✅ Found profile (ID: ${profile.id})\n`);

    // Update profile
    console.log('3️⃣  Updating profile fields...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Enri',
        last_name: 'Zhulati',
        display_name: 'Enri Z.',
        city_id: dallasCity.id,
        profile_completed: true,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Update error:', updateError);

      // Check if it's a missing column error
      if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        console.error('\n⚠️  MIGRATION REQUIRED ⚠️');
        console.error('The profile fields (first_name, last_name, etc.) do not exist yet.');
        console.error('You need to run the migration first:\n');
        console.error('1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new');
        console.error('2. Copy the contents of: supabase/migrations/add_profile_fields.sql');
        console.error('3. Paste and run in the SQL Editor\n');
      }

      throw updateError;
    }

    console.log('   ✅ Profile updated!\n');
    console.log('📋 Updated Fields:');
    console.log('   • First Name: Enri');
    console.log('   • Last Name: Zhulati');
    console.log('   • Display Name: Enri Z.');
    console.log('   • Location: Dallas, TX');
    console.log('   • Profile Completed: Yes\n');

  } catch (error: any) {
    console.error('\n❌ Error updating profile:', error.message);
    process.exit(1);
  }
}

updateProfile();
