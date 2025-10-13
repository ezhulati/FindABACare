/**
 * End-to-End Test for Voting & Review System
 * Tests all components without requiring authentication
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

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function runTests() {
  console.log('🧪 Running End-to-End Tests for Voting & Review System\n');
  console.log('═'.repeat(70));
  console.log('\n');

  // Test 1: Database Tables Exist
  console.log('📋 Test 1: Database Schema');
  console.log('─'.repeat(70));

  try {
    const { data: votes, error: votesError } = await supabase
      .from('venue_votes')
      .select('id')
      .limit(1);

    test(
      'venue_votes table',
      !votesError,
      votesError ? `Error: ${votesError.message}` : 'Table exists and is accessible'
    );
  } catch (error: any) {
    test('venue_votes table', false, `Exception: ${error.message}`);
  }

  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    test(
      'reviews table',
      !reviewsError,
      reviewsError ? `Error: ${reviewsError.message}` : 'Table exists and is accessible'
    );
  } catch (error: any) {
    test('reviews table', false, `Exception: ${error.message}`);
  }

  try {
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, upvotes, downvotes, vote_score')
      .limit(1)
      .single();

    test(
      'venues vote columns',
      !venueError,
      venueError ? `Error: ${venueError.message}` : 'Vote columns exist'
    );
  } catch (error: any) {
    test('venues vote columns', false, `Exception: ${error.message}`);
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, profile_completed')
      .limit(1)
      .single();

    test(
      'profiles fields',
      !profileError,
      profileError ? `Error: ${profileError.message}` : 'Profile fields exist'
    );
  } catch (error: any) {
    test('profiles fields', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 2: User Profile
  console.log('👤 Test 2: User Profile');
  console.log('─'.repeat(70));

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'enrizhulati@gmail.com')
      .single();

    if (error) {
      test('User profile exists', false, `Error: ${error.message}`);
    } else if (!profile) {
      test('User profile exists', false, 'Profile not found');
    } else {
      test('User profile exists', true, `Found profile for ${profile.email}`);
      test('First name set', !!profile.first_name, profile.first_name || 'Not set');
      test('Last name set', !!profile.last_name, profile.last_name || 'Not set');
      test('Display name set', !!profile.display_name, profile.display_name || 'Not set');
      test('Profile completed', profile.profile_completed === true, profile.profile_completed ? 'Yes' : 'No');
      test('City assigned', !!profile.city_id, profile.city_id || 'Not set');
    }
  } catch (error: any) {
    test('User profile', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Venue Data
  console.log('🏢 Test 3: Venue Data');
  console.log('─'.repeat(70));

  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('id, name, slug, upvotes, downvotes, vote_score')
      .eq('slug', 'dallas-zoo')
      .single();

    if (error) {
      test('Dallas Zoo venue', false, `Error: ${error.message}`);
    } else if (!venue) {
      test('Dallas Zoo venue', false, 'Venue not found');
    } else {
      test('Dallas Zoo venue', true, `Found: ${venue.name}`);
      test('Vote columns present', true, `upvotes: ${venue.upvotes}, downvotes: ${venue.downvotes}, score: ${venue.vote_score}`);
    }
  } catch (error: any) {
    test('Venue data', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Vote Counts
  console.log('🗳️  Test 4: Voting System');
  console.log('─'.repeat(70));

  try {
    const { data: votes, error } = await supabase
      .from('venue_votes')
      .select('*');

    if (error) {
      test('Vote count query', false, `Error: ${error.message}`);
    } else {
      test('Vote count query', true, `Found ${votes?.length || 0} votes in database`);

      if (votes && votes.length > 0) {
        const upvotes = votes.filter(v => v.vote_type === 'up').length;
        const downvotes = votes.filter(v => v.vote_type === 'down').length;
        test('Vote type distribution', true, `${upvotes} upvotes, ${downvotes} downvotes`);
      }
    }
  } catch (error: any) {
    test('Voting system', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 5: Reviews
  console.log('⭐ Test 5: Review System');
  console.log('─'.repeat(70));

  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*');

    if (error) {
      test('Review count query', false, `Error: ${error.message}`);
    } else {
      test('Review count query', true, `Found ${reviews?.length || 0} reviews in database`);

      if (reviews && reviews.length > 0) {
        const pending = reviews.filter(r => r.status === 'pending').length;
        const published = reviews.filter(r => r.status === 'published').length;
        test('Review status distribution', true, `${pending} pending, ${published} published`);
      }
    }
  } catch (error: any) {
    test('Review system', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 6: Storage Bucket
  console.log('📁 Test 6: Storage (Avatars)');
  console.log('─'.repeat(70));

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      test('Storage buckets', false, `Error: ${error.message}`);
    } else {
      const avatarBucket = buckets?.find(b => b.id === 'avatars');
      test('Avatars bucket exists', !!avatarBucket, avatarBucket ? `Found: ${avatarBucket.name}` : 'Not found');

      if (avatarBucket) {
        test('Avatars bucket is public', avatarBucket.public === true, avatarBucket.public ? 'Yes' : 'No');
      }
    }
  } catch (error: any) {
    test('Storage system', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Test 7: RLS Policies (check they exist)
  console.log('🔐 Test 7: Security (RLS Policies)');
  console.log('─'.repeat(70));

  try {
    // Try to read as anonymous - should work for published content
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zmt5Znp1a3duam9ta3N1dmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNDU0MTUsImV4cCI6MjA3NTcyMTQxNX0.wGDo9p2f1eU7PY-kxnJEf6EK5qCWiJ5AY-YgDVaYqCY');

    const { data: votes, error: votesError } = await anonSupabase
      .from('venue_votes')
      .select('id')
      .limit(1);

    test('RLS allows anonymous reads', !votesError, votesError ? `Blocked: ${votesError.message}` : 'Anonymous can read votes');

    const { data: reviews, error: reviewsError } = await anonSupabase
      .from('reviews')
      .select('id')
      .eq('status', 'published')
      .limit(1);

    test('RLS allows reading published reviews', !reviewsError, reviewsError ? `Blocked: ${reviewsError.message}` : 'Anonymous can read published reviews');
  } catch (error: any) {
    test('RLS policies', false, `Exception: ${error.message}`);
  }

  console.log('\n');

  // Summary
  console.log('═'.repeat(70));
  console.log('\n📊 Test Summary\n');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n');

  if (failed > 0) {
    console.log('⚠️  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
    });
    console.log('\n');
  }

  if (passed === total) {
    console.log('🎉 All tests passed! The voting and review system is fully operational.\n');
  } else {
    console.log('⚠️  Some tests failed. Review the errors above and fix the issues.\n');
  }
}

runTests();
