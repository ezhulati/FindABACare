import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Events scraped from Finding Y'all website
const events = [
  {
    title: 'Boo Bash',
    description: 'An evening of games, inflatables, train rides and inclusive Trunk-or-Treating. 11th annual event hosted by It\'s a Sensory World. FREE event.',
    date: '2025-10-18', // Saturday, October 18th
    startTime: '16:30', // 4:30 PM
    endTime: '18:30', // 6:30 PM
    location: '13617 Neutron Rd, Farmers Branch, TX',
    ageRange: 'All ages',
    capacity: 100,
    externalId: 'findingyall-boo-bash-2025',
  },
  {
    title: 'Open Gym Social: Little Kids',
    description: 'Open gym, socializing, and sensory-friendly fun. Includes gym time and sensory wind-down with refreshments.',
    date: '2025-10-08', // Saturday, October 8th
    startTime: '13:00', // 1:00 PM
    endTime: '14:30', // 2:30 PM
    location: 'Finding Y\'all Location',
    ageRange: '3-8',
    capacity: 12,
    externalId: 'findingyall-open-gym-little-kids-oct-2025',
  },
  {
    title: 'Open Gym Social: Big Kids',
    description: 'Open gym, connection, and fun. Includes gym time, refreshments, and social time.',
    date: '2025-10-08', // Saturday, October 8th
    startTime: '15:00', // 3:00 PM
    endTime: '16:30', // 4:30 PM
    location: 'Finding Y\'all Location',
    ageRange: '9-12',
    capacity: 12,
    externalId: 'findingyall-open-gym-big-kids-oct-2025',
  },
];

async function findCityByAddress(address: string) {
  // Extract city from address
  const match = address.match(/,\s*([^,]+),\s*TX/);
  const cityName = match ? match[1].trim() : null;

  if (!cityName) {
    console.log(`⚠️  Could not extract city from address: ${address}`);
    return null;
  }

  console.log(`   Looking for city: ${cityName}`);

  // Try exact match first
  let { data: city } = await supabase
    .from('cities')
    .select('id, slug')
    .eq('state', 'TX')
    .eq('status', 'active')
    .ilike('name', cityName)
    .single();

  // If not found, try Dallas as fallback (most Finding Y'all events are in Dallas area)
  if (!city) {
    console.log(`   City "${cityName}" not found, using Dallas as fallback`);
    const { data: fallback } = await supabase
      .from('cities')
      .select('id, slug')
      .eq('slug', 'dallas')
      .eq('state', 'TX')
      .single();
    city = fallback;
  }

  return city;
}

async function findOrCreateVenue(location: string, cityId: string) {
  // Try to find existing venue by name
  const venueName = location.split(',')[0].trim();

  const { data: existing } = await supabase
    .from('venues')
    .select('id')
    .eq('city_id', cityId)
    .ilike('name', `%${venueName}%`)
    .single();

  if (existing) {
    console.log(`   ✅ Found existing venue: ${venueName}`);
    return existing.id;
  }

  // Create placeholder venue
  console.log(`   ➕ Creating placeholder venue: ${venueName}`);
  const { data: newVenue, error } = await supabase
    .from('venues')
    .insert({
      name: venueName,
      address: location,
      city_id: cityId,
      slug: venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'pending',
      type: 'other',
      meter: 'Moderate',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`   ❌ Error creating venue:`, error);
    return null;
  }

  return newVenue.id;
}

async function importEvents() {
  console.log('🎯 Starting Finding Y\'all Events Import\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    console.log(`\n📅 Processing: ${event.title}`);

    try {
      // Check if event already exists
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('external_id', event.externalId)
        .single();

      if (existing) {
        console.log(`   ⏭️  Event already exists, skipping`);
        skipped++;
        continue;
      }

      // Find city
      const city = await findCityByAddress(event.location);
      if (!city) {
        console.log(`   ❌ Could not determine city, skipping`);
        errors++;
        continue;
      }

      // Find or create venue
      const venueId = await findOrCreateVenue(event.location, city.id);
      if (!venueId) {
        console.log(`   ❌ Could not create/find venue, skipping`);
        errors++;
        continue;
      }

      // Insert event
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title: event.title,
          description: event.description,
          date: event.date,
          start_time: event.startTime,
          end_time: event.endTime,
          venue_id: venueId,
          city_id: city.id,
          capacity: event.capacity,
          age_range: event.ageRange,
          event_type: 'partner',
          source_url: 'https://www.findingyall.org/finding-yall-upcoming-events',
          source_name: 'Finding Y\'all',
          external_id: event.externalId,
          status: 'published',
          approval_status: 'approved',
          scraped_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`   ❌ Error inserting event:`, insertError.message);
        errors++;
      } else {
        console.log(`   ✅ Successfully imported`);
        imported++;
      }

    } catch (err) {
      console.error(`   ❌ Unexpected error:`, err);
      errors++;
    }
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\nℹ️  Note: Some events may be in the past. Check dates if needed.`);
}

importEvents().catch(console.error);
