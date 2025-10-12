/**
 * Seed Sample Autism Events
 *
 * Manually adds curated autism events to the database
 * Run with: npx tsx scripts/seed-sample-events.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SampleEvent {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  cityName: string;
  state: string;
  venueName: string;
  venueAddress: string;
  sourceUrl?: string;
  sourceName: string;
  eventType: 'partner' | 'official' | 'community';
  externalId?: string;
}

// Curated sample events
const sampleEvents: SampleEvent[] = [
  {
    title: 'Sensory-Friendly Movie: Inside Out 2',
    description: 'Join us for a sensory-friendly screening with reduced sound, dimmed lights, and a welcoming environment for individuals with autism and sensory sensitivities.',
    date: '2025-10-25',
    startTime: '10:00',
    endTime: '12:00',
    cityName: 'Dallas',
    state: 'TX',
    venueName: 'AMC NorthPark 15',
    venueAddress: '8687 N Central Expy, Dallas, TX 75225',
    sourceName: 'autism.place',
    eventType: 'official',
  },
  {
    title: 'Autism Acceptance Walk 2025',
    description: 'Annual walk to promote autism acceptance and celebrate neurodiversity in our community. Family-friendly event with activities for all ages.',
    date: '2025-11-02',
    startTime: '09:00',
    endTime: '13:00',
    cityName: 'Houston',
    state: 'TX',
    venueName: 'Hermann Park',
    venueAddress: '6001 Fannin St, Houston, TX 77030',
    sourceUrl: 'https://autismspeaks.org',
    sourceName: 'Autism Speaks',
    eventType: 'partner',
    externalId: 'autism-speaks-houston-walk-2025',
  },
  {
    title: 'Parent Support Group Meeting',
    description: 'Monthly support group for parents and caregivers of children with autism. Share experiences, resources, and connect with others in the community.',
    date: '2025-10-20',
    startTime: '18:30',
    endTime: '20:00',
    cityName: 'Austin',
    state: 'TX',
    venueName: 'Austin Public Library - Central Branch',
    venueAddress: '710 W Cesar Chavez St, Austin, TX 78701',
    sourceName: 'autism.place',
    eventType: 'official',
  },
  {
    title: 'Sensory Play Day at the Museum',
    description: 'Special sensory-friendly hours at the children\'s museum with reduced crowds and trained staff to support neurodiverse visitors.',
    date: '2025-10-28',
    startTime: '14:00',
    endTime: '17:00',
    cityName: 'Phoenix',
    state: 'AZ',
    venueName: 'Children\'s Museum of Phoenix',
    venueAddress: '215 N 7th St, Phoenix, AZ 85034',
    sourceName: 'autism.place',
    eventType: 'official',
  },
  {
    title: 'ABA Therapy Workshop for Parents',
    description: 'Learn practical ABA techniques you can use at home. Workshop led by Board Certified Behavior Analysts.',
    date: '2025-11-05',
    startTime: '17:00',
    endTime: '19:00',
    cityName: 'Los Angeles',
    state: 'CA',
    venueName: 'LA Community Center',
    venueAddress: '123 Main St, Los Angeles, CA 90012',
    sourceName: 'autism.place',
    eventType: 'official',
  },
  {
    title: 'Social Skills Playgroup (Ages 5-10)',
    description: 'Structured playgroup focused on developing social skills in a supportive environment. Led by occupational therapist.',
    date: '2025-10-22',
    startTime: '16:00',
    endTime: '17:30',
    cityName: 'San Diego',
    state: 'CA',
    venueName: 'Balboa Park Activity Center',
    venueAddress: '2145 Park Blvd, San Diego, CA 92101',
    sourceName: 'autism.place',
    eventType: 'official',
  },
  {
    title: 'Quiet Hour Shopping Event',
    description: 'Special shopping hours with reduced music, dimmed lights, and a calm environment for individuals with sensory sensitivities.',
    date: '2025-10-27',
    startTime: '08:00',
    endTime: '10:00',
    cityName: 'New York',
    state: 'NY',
    venueName: 'Target Manhattan',
    venueAddress: '455 5th Ave, New York, NY 10016',
    sourceUrl: 'https://target.com',
    sourceName: 'Target',
    eventType: 'partner',
    externalId: 'target-quiet-hour-nyc-oct',
  },
  {
    title: 'Neurodiversity Employment Fair',
    description: 'Connect with employers committed to neurodiversity hiring. Workshops on interview skills and workplace accommodations.',
    date: '2025-11-10',
    startTime: '10:00',
    endTime: '15:00',
    cityName: 'Chicago',
    state: 'IL',
    venueName: 'Chicago Convention Center',
    venueAddress: '301 E Cermak Rd, Chicago, IL 60616',
    sourceName: 'autism.place',
    eventType: 'official',
  },
];

/**
 * Find city by name and state
 */
async function findCity(cityName: string, state: string) {
  const { data: city, error } = await supabase
    .from('cities')
    .select('id, slug')
    .eq('state', state)
    .eq('status', 'active')
    .ilike('name', cityName)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`   Error finding city ${cityName}:`, error);
    return null;
  }

  return city;
}

/**
 * Find or create venue
 */
async function findOrCreateVenue(venueName: string, address: string, cityId: string) {
  // Try to find existing venue
  const { data: existingVenue } = await supabase
    .from('venues')
    .select('id')
    .eq('city_id', cityId)
    .ilike('name', `%${venueName}%`)
    .single();

  if (existingVenue) {
    return existingVenue.id;
  }

  // Create new venue
  const slug = venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data: newVenue, error } = await supabase
    .from('venues')
    .insert({
      name: venueName,
      address: address,
      city_id: cityId,
      slug: `${slug}-${Date.now()}`,
      status: 'pending',
      type: 'other',
      meter: 'Moderate',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`   Error creating venue ${venueName}:`, error);
    return null;
  }

  console.log(`   ➕ Created venue: ${venueName}`);
  return newVenue.id;
}

/**
 * Import sample events
 */
async function importEvents() {
  console.log('🌟 Seeding Sample Autism Events\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of sampleEvents) {
    try {
      console.log(`\n📅 Processing: ${event.title}`);

      // Check if event already exists (by external_id or title+date)
      if (event.externalId) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', event.externalId)
          .single();

        if (existing) {
          console.log(`   ⏭️  Already exists (by external_id)`);
          skipped++;
          continue;
        }
      }

      // Find city
      const city = await findCity(event.cityName, event.state);
      if (!city) {
        console.log(`   ❌ City not found: ${event.cityName}, ${event.state}`);
        errors++;
        continue;
      }

      // Find or create venue
      const venueId = await findOrCreateVenue(event.venueName, event.venueAddress, city.id);
      if (!venueId) {
        console.log(`   ❌ Could not create venue: ${event.venueName}`);
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
          event_type: event.eventType,
          source_url: event.sourceUrl || null,
          source_name: event.sourceName,
          external_id: event.externalId || null,
          status: 'published',
          approval_status: 'approved',
          scraped_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`   ❌ Error inserting:`, insertError.message);
        errors++;
      } else {
        console.log(`   ✅ Imported successfully`);
        imported++;
      }

    } catch (err) {
      console.error(`   ❌ Error processing event:`, err);
      errors++;
    }
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n✨ Done!`);
}

// Run
importEvents().catch(console.error);
