/**
 * Cleanup Test Events
 *
 * Removes all fake/test events from the production database:
 * - 6 "official" events with source_name: 'autism.place' (sample data)
 * - 2 "community" test events from workflow testing
 *
 * Keeps only real partner events from external sources.
 *
 * Run with: npx tsx scripts/cleanup-test-events.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupTestEvents() {
  console.log('🧹 Cleaning up test/fake events from production database\n');

  // Step 1: Find all fake "official" events from autism.place
  console.log('📋 Finding fake "official" events...');
  const { data: fakeOfficialEvents } = await supabase
    .from('events')
    .select('id, title, event_type, source_name')
    .eq('source_name', 'autism.place')
    .eq('event_type', 'official');

  console.log(`   Found ${fakeOfficialEvents?.length || 0} fake official events`);
  if (fakeOfficialEvents && fakeOfficialEvents.length > 0) {
    fakeOfficialEvents.forEach(event => {
      console.log(`   - ${event.title}`);
    });
  }

  // Step 2: Find all test community events
  console.log('\n📋 Finding test community events...');
  const { data: testCommunityEvents } = await supabase
    .from('events')
    .select('id, title, event_type, source_name')
    .eq('source_name', 'Community Submission');

  console.log(`   Found ${testCommunityEvents?.length || 0} test community events`);
  if (testCommunityEvents && testCommunityEvents.length > 0) {
    testCommunityEvents.forEach(event => {
      console.log(`   - ${event.title}`);
    });
  }

  // Step 3: Get total count to delete
  const totalToDelete = (fakeOfficialEvents?.length || 0) + (testCommunityEvents?.length || 0);
  console.log(`\n⚠️  Total events to delete: ${totalToDelete}`);

  if (totalToDelete === 0) {
    console.log('✅ No test events found. Database is clean!');
    return;
  }

  // Step 4: Delete fake official events
  if (fakeOfficialEvents && fakeOfficialEvents.length > 0) {
    console.log('\n🗑️  Deleting fake official events...');
    const { error: deleteOfficialError } = await supabase
      .from('events')
      .delete()
      .eq('source_name', 'autism.place')
      .eq('event_type', 'official');

    if (deleteOfficialError) {
      console.error('   ❌ Error deleting fake official events:', deleteOfficialError);
    } else {
      console.log(`   ✅ Deleted ${fakeOfficialEvents.length} fake official events`);
    }
  }

  // Step 5: Delete test community events
  if (testCommunityEvents && testCommunityEvents.length > 0) {
    console.log('\n🗑️  Deleting test community events...');
    const { error: deleteCommunityError } = await supabase
      .from('events')
      .delete()
      .eq('source_name', 'Community Submission');

    if (deleteCommunityError) {
      console.error('   ❌ Error deleting test community events:', deleteCommunityError);
    } else {
      console.log(`   ✅ Deleted ${testCommunityEvents.length} test community events`);
    }
  }

  // Step 6: Verify remaining events
  console.log('\n✅ Verifying remaining events...');
  const { data: remainingEvents } = await supabase
    .from('events')
    .select('id, title, event_type, source_name, status, approval_status')
    .eq('status', 'published')
    .eq('approval_status', 'approved');

  console.log(`\n📊 Remaining published events: ${remainingEvents?.length || 0}`);
  if (remainingEvents && remainingEvents.length > 0) {
    remainingEvents.forEach(event => {
      console.log(`   ✅ ${event.title} (${event.event_type}, ${event.source_name})`);
    });
  }

  // Step 7: Also delete test venues created during seeding
  console.log('\n🧹 Cleaning up test venues...');
  const { data: testVenues } = await supabase
    .from('venues')
    .select('id, name, status')
    .eq('status', 'pending');

  console.log(`   Found ${testVenues?.length || 0} pending venues`);
  if (testVenues && testVenues.length > 0) {
    // Delete venues that have no events
    for (const venue of testVenues) {
      const { data: venueEvents } = await supabase
        .from('events')
        .select('id')
        .eq('venue_id', venue.id);

      if (!venueEvents || venueEvents.length === 0) {
        const { error } = await supabase
          .from('venues')
          .delete()
          .eq('id', venue.id);

        if (error) {
          console.error(`   ❌ Error deleting venue ${venue.name}:`, error);
        } else {
          console.log(`   🗑️  Deleted orphan venue: ${venue.name}`);
        }
      }
    }
  }

  console.log('\n✨ Cleanup complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npx tsx scripts/check-events.ts');
  console.log('   2. Verify only real partner events remain');
  console.log('   3. Visit /events to confirm the live site is clean');
}

cleanupTestEvents().catch(console.error);
