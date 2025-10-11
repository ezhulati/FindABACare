import { createClient } from '@supabase/supabase-js';

/**
 * Seed sample reviews for testing moderation
 * Run with: npx tsx scripts/seed-sample-reviews.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleReviews = [
  {
    content: "Visited on a Tuesday morning and it was perfect! The museum was quiet with minimal crowds. Staff were understanding when my son needed a break. The dinosaur exhibit has adjustable lighting which was great.",
    predictability: 4,
    sensory_level: 2,
    staff_knowledge: 5,
    best_time: "Weekday mornings before 11am",
    triggers: ["Loud exhibits", "Crowds during weekends"]
  },
  {
    content: "Great experience overall. We called ahead and they let us preview the planetarium before the show. The gift shop can be overwhelming but they have a quiet corner. Bathrooms are clean and spacious.",
    predictability: 5,
    sensory_level: 3,
    staff_knowledge: 5,
    best_time: "First show of the day",
    triggers: ["Gift shop music", "Hand dryers"]
  },
  {
    content: "The exhibits are fascinating but it can get very loud on weekends. We visited during spring break and it was too much. Plan to go during school hours if possible. The staff were very accommodating.",
    predictability: 3,
    sensory_level: 4,
    staff_knowledge: 4,
    best_time: "Weekdays during school year",
    triggers: ["Crowds", "Loud music", "Echo in large halls"]
  },
  {
    content: "Amazing! They offer sensory-friendly hours on the first Saturday of each month. Much quieter, dimmed lights, and fewer people. Staff received autism training and it shows. Highly recommend!",
    predictability: 5,
    sensory_level: 2,
    staff_knowledge: 5,
    best_time: "Sensory-friendly Saturdays 8-10am",
    triggers: []
  },
  {
    content: "We had mixed results. The exhibits are great but some areas are unpredictable with sudden loud sounds. The interactive sections can be chaotic. Bring noise-canceling headphones.",
    predictability: 2,
    sensory_level: 4,
    staff_knowledge: 3,
    best_time: "Opening time on weekdays",
    triggers: ["Unpredictable noises", "Crowds", "Bright lights"]
  }
];

async function seedReviews() {
  console.log('🚀 Seeding sample reviews...\n');

  // Get a test venue (Perot Museum)
  const { data: venue } = await supabase
    .from('venues')
    .select('id, name')
    .eq('slug', 'perot-museum-of-nature-and-science')
    .single();

  if (!venue) {
    console.error('❌ Could not find Perot Museum venue');
    process.exit(1);
  }

  console.log(`✓ Found venue: ${venue.name}\n`);

  // Get or create test user
  let testUser;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  testUser = users.find(u => u.email === 'test@findabacare.com');

  if (!testUser) {
    console.log('Creating test user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@findabacare.com',
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Error creating test user:', error);
      process.exit(1);
    }

    testUser = data.user;
    console.log('✓ Created test user\n');
  }

  // Get or create profile
  let profile;
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', testUser.id)
    .single();

  if (existingProfile) {
    profile = existingProfile;
  } else {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: testUser.id,
        role: 'parent',
        display_name: 'Sarah Martinez',
        child_age_band: '5-7',
        interests: ['Science', 'Animals', 'Nature'],
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error);
      process.exit(1);
    }

    profile = newProfile;
    console.log('✓ Created test profile\n');
  }

  // Insert reviews
  let created = 0;
  for (const review of sampleReviews) {
    const { error } = await supabase
      .from('reviews')
      .insert({
        venue_id: venue.id,
        profile_id: profile.id,
        ...review,
        status: 'pending', // All start as pending for moderation
      });

    if (error) {
      console.error(`❌ Error creating review:`, error.message);
    } else {
      created++;
      console.log(`✓ Created review ${created}/${sampleReviews.length}`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Successfully created ${created} sample reviews!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Set your email as admin: npx tsx scripts/set-admin.ts <your-email>`);
  console.log(`   2. Visit /admin/reviews to moderate`);
  console.log(`   3. Approve/reject the pending reviews\n`);
}

seedReviews();
