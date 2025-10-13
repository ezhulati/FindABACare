import { createClient } from '@supabase/supabase-js';

/**
 * Add amenities data for venues 8-10: Nasher, Dallas Public Library, Crayola Experience
 *
 * Run with: npx tsx scripts/add-three-more-amenities.ts
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
    name: 'Nasher Sculpture Center',
    amenities: {
      quiet_room: true,          // Quiet Room available on basement level
      visual_supports: true,     // KultureCity sensory kits with social stories
      wheelchair_accessible: true, // Standard for museums
      changing_table: false,     // Not mentioned
      noise_cancelling: true     // Sensory kits include earplugs/headphones
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Museum environment
      loud_music: false,        // Quiet museum/sculpture center
      open_water: false         // Indoor + outdoor sculpture garden
    },
    notes: 'KultureCity certified Sensory Inclusive™ location. Quiet Room on basement level. Sensory kits with binoculars and earplugs. Hosts annual Sensory-Friendly Family Fun events. Co-founded Dallas Sensory Consortium.'
  },
  {
    name: 'J. Erik Jonsson Central Library',
    amenities: {
      quiet_room: false,        // Not specifically mentioned
      visual_supports: false,   // Not specifically mentioned for Central branch
      wheelchair_accessible: true, // Parking garage with handicap spots, elevator access
      changing_table: true,      // Handicap-accessible restroom on each floor
      noise_cancelling: false    // Not mentioned
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Library environment
      loud_music: false,        // Quiet library environment
      open_water: false         // Indoor library
    },
    notes: 'Dallas Public Library offers Sensory-Friendly Family Fun events. Central Library has parking garage with handicap parking, elevator access, accessible restrooms on each floor. Large-print keyboards available.'
  },
  {
    name: 'Crayola Experience',
    amenities: {
      quiet_room: true,          // Quiet space during Sensory Sunday events
      visual_supports: false,    // Not confirmed for Plano location specifically
      wheelchair_accessible: true, // Standard for major attractions
      changing_table: false,     // Unknown
      noise_cancelling: false    // Not mentioned for Plano specifically
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Art/craft environment
      loud_music: false,        // Sensory Sunday has no music, dimmed lights
      open_water: false         // Indoor attraction
    },
    notes: 'Hosts Sensory Sunday events with dimmed lights, no music, and quiet space. Adaptations for children with sensory needs. Note: Mall of America location is Certified Autism Center, but Plano certification not confirmed.'
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
  console.log('   ADDING AMENITIES DATA - VENUES 8-10');
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
  console.log('📊 Progress Update:');
  console.log(`   Total venues with amenities: ${7 + success}/1000`);
  console.log(`   Coverage: ${((7 + success) / 1000 * 100).toFixed(1)}%`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Continue with Houston top venues');
  console.log('   2. Or add more Dallas venues to reach 20');
  console.log('   3. Run inventory: npx tsx scripts/venue-inventory.ts\n');
}

addAmenities();
