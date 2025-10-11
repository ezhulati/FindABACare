import { createClient } from '@supabase/supabase-js';

/**
 * Set a user as admin by email
 * Run with: npx tsx scripts/set-admin.ts <email>
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: npx tsx scripts/set-admin.ts <email>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
  console.log(`🔍 Looking for user with email: ${email}\n`);

  // Get user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error fetching users:', userError);
    process.exit(1);
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    console.log('\n📋 Available users:');
    users.forEach(u => console.log(`   - ${u.email}`));
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // Get or create profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      process.exit(1);
    }

    console.log('✅ Updated existing profile to admin role');
  } else {
    // Create new profile
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'admin',
        display_name: user.email?.split('@')[0] || 'Admin',
      });

    if (createError) {
      console.error('❌ Error creating profile:', createError);
      process.exit(1);
    }

    console.log('✅ Created new admin profile');
  }

  console.log('\n🎉 Done! User is now an admin.');
  console.log(`   Visit /admin to access admin dashboard`);
}

setAdmin();
