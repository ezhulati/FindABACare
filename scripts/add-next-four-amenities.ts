import { createClient } from '@supabase/supabase-js';

/**
 * Add amenities data for next 4 well-researched Dallas venues
 * Venues 4-7: Dallas Arboretum, Children's Aquarium, Dallas World Aquarium, Sixth Floor Museum
 *
 * Run with: npx tsx scripts/add-next-four-amenities.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VenueAmenities {
  name: string;
  amenities: {
    quiet_room: boolean;
    visual_supports: boolean;
    wheelchair_accessible: boolean;
    changing_table: boolean;
    noise_cancelling: boolean;
  };
  triggers: {
    hand_dryer: boolean;
    strong_scents: boolean;
    loud_music: boolean;
    open_water: boolean;
  };
  notes: string;
}

const venuesData: VenueAmenities[] = [
  {
    name: 'Dallas Arboretum and Botanical Garden',
    amenities: {
      quiet_room: false,         // No dedicated quiet room found
      visual_supports: false,    // Not mentioned in accessibility info
      wheelchair_accessible: true, // Wheelchairs available, accessible pathways with ramps
      changing_table: false,     // Unknown, not mentioned
      noise_cancelling: false    // Not mentioned
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: true,      // Botanical garden - natural flower/plant scents
      loud_music: false,        // Outdoor botanical environment, typically quiet
      open_water: true          // Water features and gardens with ponds
    },
    notes: 'Wheelchairs and mobility scooters available. Tram tours with priority for mobility-impaired. Community partner at Dallas sensory-friendly events. Note: Natural terrain may pose accessibility challenges in some areas.'
  },
  {
    name: "Children's Aquarium Dallas at Fair Park",
    amenities: {
      quiet_room: true,          // Sensory Havens available during sensory-friendly events
      visual_supports: true,     // Working toward Certified Sensory Inclusive designation
      wheelchair_accessible: true, // Standard for major attractions
      changing_table: false,     // Unknown, not specifically mentioned
      noise_cancelling: false    // Not mentioned, but sensory training provided
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Aquarium environment, not expected
      loud_music: false,        // Family-friendly aquarium
      open_water: true          // Aquarium with touch tanks and water exhibits
    },
    notes: 'Working toward Certified Sensory Inclusive facility. Staff trained on sensory issues. Hosts sensory-friendly days with Sensory Havens. Interactive touch tanks and hands-on exhibits.'
  },
  {
    name: 'Dallas World Aquarium',
    amenities: {
      quiet_room: true,          // Nursing station (Level 2) + large quiet area (Level 1)
      visual_supports: true,     // AAC tools and communication boards available
      wheelchair_accessible: true, // Designed to be wheelchair accessible throughout
      changing_table: false,     // Unknown, not mentioned
      noise_cancelling: false    // Not mentioned, but quiet areas available
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Not expected in aquarium
      loud_music: false,        // Quiet atmosphere
      open_water: true          // Aquarium with open exhibits
    },
    notes: 'Sensory-friendly guide available. AAC communication tools for non-verbal guests. Quiet spaces on multiple levels. Wheelchair accessible with ramps/elevators. Service animals welcomed.'
  },
  {
    name: 'The Sixth Floor Museum at Dealey Plaza',
    amenities: {
      quiet_room: false,        // Not specifically mentioned
      visual_supports: true,     // KultureCity sensory bags available in Visitors Center
      wheelchair_accessible: true, // All levels accessible, ramp at northwest corner
      changing_table: true,      // Fully accessible restroom stalls mentioned
      noise_cancelling: true     // KultureCity sensory bags typically include headphones
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Museum environment
      loud_music: false,        // Quiet museum
      open_water: false         // Indoor museum
    },
    notes: 'KultureCity certified. Sensory bags available at Visitors Center. Wheelchairs available first-come, first-served. All levels wheelchair accessible with ramp and accessible restrooms.'
  }
];

async function findVenueByName(name: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, slug, amenities, triggers')
    .ilike('name', `%${name}%`)
    .limit(1);

  if (error) {
    console.error(`   ⚠️  Error finding venue "${name}":`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

async function updateVenueAmenities(venueId: string, venueName: string, amenities: any, triggers: any) {
  const { error } = await supabase
    .from('venues')
    .update({
      amenities,
      triggers
    })
    .eq('id', venueId);

  if (error) {
    console.error(`   ❌ Failed to update "${venueName}":`, error.message);
    return false;
  }

  return true;
}

async function addAmenities() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   ADDING AMENITIES DATA - NEXT 4 DALLAS VENUES');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📅 ${new Date().toLocaleString()}\n`);

  let success = 0;
  let failed = 0;
  let notFound = 0;

  for (const venueData of venuesData) {
    console.log(`🔍 Searching for: ${venueData.name}`);

    const venue = await findVenueByName(venueData.name);

    if (!venue) {
      console.log(`   ⚠️  Venue not found in database\n`);
      notFound++;
      continue;
    }

    console.log(`   ✅ Found: ${venue.name} (${venue.slug})`);
    console.log(`   📝 Current amenities:`, venue.amenities ? 'Some data exists' : 'None');

    console.log(`   🔄 Updating with new amenities data...`);

    const updated = await updateVenueAmenities(
      venue.id,
      venue.name,
      venueData.amenities,
      venueData.triggers
    );

    if (updated) {
      success++;
      console.log(`   ✅ Successfully updated!`);
      console.log(`   📋 Amenities added:`);
      Object.entries(venueData.amenities).forEach(([key, value]) => {
        if (value) console.log(`      ✓ ${key.replace(/_/g, ' ')}`);
      });
      console.log(`   ⚠️  Triggers noted:`);
      Object.entries(venueData.triggers).forEach(([key, value]) => {
        if (value) console.log(`      ⚠ ${key.replace(/_/g, ' ')}`);
      });
      console.log(`   💬 Note: ${venueData.notes.substring(0, 80)}...`);
    } else {
      failed++;
    }

    console.log('');
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('   COMPLETE');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`✅ Successfully updated: ${success} venues`);
  console.log(`❌ Failed:              ${failed} venues`);
  console.log(`⚠️  Not found:          ${notFound} venues`);
  console.log('');
  console.log('📊 Next steps:');
  console.log('   1. Run inventory to verify: npx tsx scripts/venue-inventory.ts');
  console.log('   2. View venues on site: pnpm dev → /texas/dallas');
  console.log('   3. Continue adding more venues (Nasher, Dallas Public Library, etc.)\n');
}

addAmenities();
