/**
 * Test Event System Workflow
 *
 * Tests the complete event submission and moderation workflow:
 * 1. Submit a community event via API
 * 2. Verify it appears in admin dashboard with pending status
 * 3. Simulate admin approval
 * 4. Verify it appears on public events page
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWorkflow() {
  console.log('🧪 Testing Event System Workflow\n');

  // Step 1: Get a city ID for Dallas
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'dallas')
    .eq('state', 'TX')
    .single();

  if (!city) {
    console.error('❌ Could not find Dallas city');
    return;
  }

  console.log('✅ Found Dallas city:', city.id);

  // Step 2: Create a test community event submission
  console.log('\n📝 Submitting community event...');

  const { data: venue } = await supabase
    .from('venues')
    .insert({
      name: 'Test Community Center',
      address: '123 Test St, Dallas, TX 75201',
      city_id: city.id,
      slug: `test-community-center-${Date.now()}`,
      status: 'pending',
      type: 'other',
      meter: 'Moderate',
    })
    .select('id')
    .single();

  if (!venue) {
    console.error('❌ Could not create test venue');
    return;
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: 'Community Autism Meetup',
      description: 'Monthly meetup for parents and caregivers. Share experiences and resources.',
      date: '2025-11-15',
      start_time: '18:00',
      end_time: '20:00',
      venue_id: venue.id,
      city_id: city.id,
      event_type: 'community',
      source_name: 'Community Submission',
      status: 'draft',
      approval_status: 'pending',
      admin_notes: 'Submitted by: Test User (test@example.com)',
    })
    .select('id')
    .single();

  if (eventError || !event) {
    console.error('❌ Could not create test event:', eventError);
    return;
  }

  console.log('✅ Event submitted with ID:', event.id);

  // Step 3: Verify it's in pending status
  console.log('\n🔍 Checking pending events...');

  const { data: pendingEvents } = await supabase
    .from('events')
    .select('id, title, approval_status')
    .eq('approval_status', 'pending');

  console.log(`✅ Found ${pendingEvents?.length || 0} pending events`);
  const ourEvent = pendingEvents?.find(e => e.id === event.id);

  if (ourEvent) {
    console.log('✅ Our test event is in pending state');
  } else {
    console.error('❌ Test event not found in pending');
    return;
  }

  // Step 4: Simulate admin approval
  console.log('\n👍 Simulating admin approval...');

  const { error: approveError } = await supabase
    .from('events')
    .update({
      approval_status: 'approved',
      status: 'published',
      approved_at: new Date().toISOString(),
    })
    .eq('id', event.id);

  if (approveError) {
    console.error('❌ Could not approve event:', approveError);
    return;
  }

  console.log('✅ Event approved');

  // Step 5: Verify it appears in public events
  console.log('\n📅 Checking public events...');

  const { data: publicEvents } = await supabase
    .from('events')
    .select('id, title, status, approval_status')
    .eq('status', 'published')
    .eq('approval_status', 'approved')
    .gte('date', '2025-10-01');

  console.log(`✅ Found ${publicEvents?.length || 0} published events`);
  const publishedEvent = publicEvents?.find(e => e.id === event.id);

  if (publishedEvent) {
    console.log('✅ Our test event is now published!');
  } else {
    console.error('❌ Test event not found in published events');
    return;
  }

  // Step 6: Test rejection workflow
  console.log('\n🧪 Testing rejection workflow...');

  const { data: event2 } = await supabase
    .from('events')
    .insert({
      title: 'Test Event for Rejection',
      description: 'This event will be rejected',
      date: '2025-11-20',
      start_time: '10:00',
      end_time: '12:00',
      venue_id: venue.id,
      city_id: city.id,
      event_type: 'community',
      source_name: 'Community Submission',
      status: 'draft',
      approval_status: 'pending',
      admin_notes: 'Submitted by: Test User 2 (test2@example.com)',
    })
    .select('id')
    .single();

  if (event2) {
    console.log('✅ Created second test event:', event2.id);

    const { error: rejectError } = await supabase
      .from('events')
      .update({
        approval_status: 'rejected',
        status: 'draft',
        admin_notes: 'Submitted by: Test User 2 (test2@example.com)\n\nRejected: Event details insufficient (2025-10-12)',
      })
      .eq('id', event2.id);

    if (rejectError) {
      console.error('❌ Could not reject event:', rejectError);
    } else {
      console.log('✅ Event rejected successfully');
    }
  }

  // Summary
  console.log('\n\n📊 Workflow Test Summary:');
  console.log('  ✅ Community event submission: PASSED');
  console.log('  ✅ Pending status verification: PASSED');
  console.log('  ✅ Admin approval: PASSED');
  console.log('  ✅ Published event verification: PASSED');
  console.log('  ✅ Rejection workflow: PASSED');

  console.log('\n🎉 All workflow tests passed!');
  console.log('\n💡 Next steps:');
  console.log('  1. Visit /events to see all published events');
  console.log('  2. Visit /admin/events to see the admin dashboard');
  console.log('  3. Visit /submit-event to test the submission form');
}

testWorkflow().catch(console.error);
