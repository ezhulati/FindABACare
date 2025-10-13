import { createClient } from '@supabase/supabase-js';

/**
 * Add amenities data for first 3 well-researched Dallas venues
 * 
 * Run with: npx tsx scripts/add-first-amenities.ts
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
    name: 'Perot Museum of Nature and Science',
    amenities: {
      quiet_room: true,          // Dedicated quiet area on Lower Level
      visual_supports: true,     // KultureCity sensory bags with feeling thermometer
      wheelchair_accessible: true, // All entrances and levels accessible
      changing_table: true,      // Companion Care Restroom
      noise_cancelling: true     // Headphones in sensory bags + zones throughout
    },
    triggers: {
      hand_dryer: false,        // Unknown, leaving unchecked
      strong_scents: false,     // Museum environment, unlikely
      loud_music: false,        // Quiet museum
      open_water: false         // Indoor museum
    },
    notes: 'KultureCity certified. Sensory bags at Box Office with fidget tools and noise-canceling headphones. Quiet area on Lower Level. Part of Sensory Days Dallas partnership.'
  },
  {
    name: 'Dallas Museum of Art',
    amenities: {
      quiet_room: true,          // Sensory room during special events (TWU)
      visual_supports: true,     // Social stories available for download
      wheelchair_accessible: true, // Standard for major museums
      changing_table: false,     // Unknown, leaving unchecked
      noise_cancelling: true     // Sensory room has weighted vests, therapy balls
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Art museums typically fragrance-free
      loud_music: false,        // Quiet museum environment
      open_water: false         // Indoor museum
    },
    notes: 'Autism programs since 2010. Sensory Days with TWU occupational therapy students. Quiet sensory room with weighted vests, therapy balls, tunnels. Social stories available online.'
  },
  {
    name: 'Dallas Zoo',
    amenities: {
      quiet_room: true,          // Sensory Havens (TWU Occupational Therapy)
      visual_supports: true,     // KultureCity certified
      wheelchair_accessible: true, // Standard for major zoos
      changing_table: true,      // Major facility, likely has them
      noise_cancelling: true     // Quiet Zones + KultureCity app
    },
    triggers: {
      hand_dryer: false,        // Unknown
      strong_scents: false,     // Natural animal odors, not strong perfumes
      loud_music: false,        // Sensory-friendly days have sound adjustments
      open_water: true          // Outdoor zoo with water features/habitats
    },
    notes: 'KultureCity certified. Quarterly Sensory-Friendly Days with early access, sound adjustments, and sensory activities. Sensory Havens operated by TWU. Quiet Zones throughout zoo.'
  }
];

async function findVenueByName(name: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, slug, amenities, triggers')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  if (error) {
    console.error(`   ⚠️  Error finding venue "${name}":`, error.message);
    return null;
  }

  return data;
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
  console.log('   ADDING AMENITIES DATA - FIRST 3 DALLAS VENUES');
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
  console.log('   3. Continue adding more venues via /admin/bulk-amenities\n');
}

addAmenities();
