/**
 * Check if voting system tables and columns exist
 * Usage: SUPABASE_SERVICE_ROLE_KEY="xxx" npx tsx scripts/check-voting-system.ts
 */

import { createClient } from '@supabase/supabase-js';

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

async function checkVotingSystem() {
  console.log('🔍 Checking voting system setup...\n');

  try {
    // Check if venue_votes table exists
    console.log('1️⃣  Checking venue_votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('venue_votes')
      .select('id')
      .limit(1);

    if (votesError) {
      if (votesError.message.includes('does not exist')) {
        console.log('   ❌ venue_votes table does NOT exist\n');
        console.log('⚠️  MIGRATION REQUIRED: add_venue_votes.sql\n');
        return false;
      }
      throw votesError;
    }
    console.log('   ✅ venue_votes table exists\n');

    // Check if venues table has vote columns
    console.log('2️⃣  Checking venues table vote columns...');
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, upvotes, downvotes, vote_score')
      .limit(1)
      .single();

    if (venueError) {
      if (venueError.message.includes('does not exist')) {
        console.log('   ❌ Vote columns (upvotes, downvotes, vote_score) do NOT exist\n');
        console.log('⚠️  MIGRATION REQUIRED: add_venue_votes.sql\n');
        return false;
      }
      throw venueError;
    }
    console.log('   ✅ Vote columns exist (upvotes, downvotes, vote_score)\n');

    // Check if reviews table exists
    console.log('3️⃣  Checking reviews table...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (reviewsError) {
      if (reviewsError.message.includes('does not exist')) {
        console.log('   ❌ reviews table does NOT exist\n');
        console.log('⚠️  MIGRATION REQUIRED: add_venue_votes.sql\n');
        return false;
      }
      throw reviewsError;
    }
    console.log('   ✅ reviews table exists\n');

    console.log('✅ All voting system components are in place!\n');
    console.log('📋 System Status:');
    console.log('   • venue_votes table: ✅');
    console.log('   • venues vote columns: ✅');
    console.log('   • reviews table: ✅\n');
    console.log('🎉 The voting and review system is ready to use!\n');

    return true;

  } catch (error: any) {
    console.error('❌ Error checking voting system:', error.message);
    process.exit(1);
  }
}

checkVotingSystem();
