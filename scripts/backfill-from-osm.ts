import { createClient } from '@supabase/supabase-js';

/**
 * Backfill Venue Contact Info & Hours from OpenStreetMap
 *
 * Uses Nominatim (OSM) API to find venue details and update database
 * 100% FREE with no API key required
 *
 * Rate limit: 1 request per second (enforced by sleep)
 *
 * Run with: npx tsx scripts/backfill-from-osm.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OSMPlace {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  extratags?: {
    phone?: string;
    website?: string;
    'contact:phone'?: string;
    'contact:website'?: string;
    opening_hours?: string;
  };
}

interface UpdateStats {
  total: number;
  updated: number;
  skipped: number;
  failed: number;
  foundPhone: number;
  foundWebsite: number;
  foundHours: number;
}

// Sleep function to respect rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search OpenStreetMap Nominatim API for venue details
 */
async function searchOSM(venueName: string, lat: number, lng: number): Promise<OSMPlace | null> {
  try {
    // Search by coordinates first (more accurate)
    const url = `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&` +
      `lat=${lat}&` +
      `lon=${lng}&` +
      `zoom=18&` +
      `addressdetails=1&` +
      `extratags=1&` +
      `namedetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FindABACare/1.0 (Autism-friendly venue directory)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`   ⚠️  OSM API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // If reverse geocoding doesn't find the exact place, try search
    if (!data.extratags || (!data.extratags.phone && !data.extratags.website)) {
      return await searchOSMByName(venueName, lat, lng);
    }

    return data as OSMPlace;
  } catch (error) {
    console.error(`   ⚠️  OSM search failed:`, error);
    return null;
  }
}

/**
 * Search OSM by name near coordinates
 */
async function searchOSMByName(venueName: string, lat: number, lng: number): Promise<OSMPlace | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(venueName)}&` +
      `format=json&` +
      `lat=${lat}&` +
      `lon=${lng}&` +
      `limit=1&` +
      `addressdetails=1&` +
      `extratags=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FindABACare/1.0 (Autism-friendly venue directory)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return data[0] as OSMPlace;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse OSM opening_hours into simplified format
 */
function parseOpeningHours(osmHours: string): string | null {
  if (!osmHours || osmHours === '24/7') {
    return osmHours === '24/7' ? 'Open 24 hours' : null;
  }

  // OSM uses format like "Mo-Fr 09:00-17:00; Sa 10:00-14:00"
  // We'll store it as-is for now, can be parsed more specifically later
  return osmHours;
}

/**
 * Update venue with OSM data
 */
async function updateVenue(venueId: string, osmData: OSMPlace): Promise<boolean> {
  try {
    const updates: any = {};
    let foundData = false;

    // Extract phone
    const phone = osmData.extratags?.phone ||
                  osmData.extratags?.['contact:phone'];
    if (phone) {
      updates.phone = phone;
      foundData = true;
    }

    // Extract website
    const website = osmData.extratags?.website ||
                    osmData.extratags?.['contact:website'];
    if (website) {
      updates.website = website;
      foundData = true;
    }

    // Extract hours
    const hours = osmData.extratags?.opening_hours;
    if (hours) {
      updates.hours = parseOpeningHours(hours);
      foundData = true;
    }

    if (!foundData) {
      return false;
    }

    // Update database
    const { error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', venueId);

    if (error) {
      console.error(`   ⚠️  Database update failed:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`   ⚠️  Update failed:`, error);
    return false;
  }
}

/**
 * Main backfill function
 */
async function backfillContactInfo(limit: number = 100, offset: number = 0) {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   OPENSTREETMAP BACKFILL - Contact Info & Hours');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📅 Started: ${new Date().toLocaleString()}\n`);

  const stats: UpdateStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    foundPhone: 0,
    foundWebsite: 0,
    foundHours: 0
  };

  // Get venues missing contact info or hours
  console.log(`🔍 Fetching venues needing updates (limit: ${limit}, offset: ${offset})...\n`);

  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, lat, lng, phone, website, hours, cities(name, state)')
    .eq('status', 'active')
    .or('phone.is.null,website.is.null,hours.is.null')
    .range(offset, offset + limit - 1);

  if (error || !venues || venues.length === 0) {
    console.log('⚠️  No venues found or error occurred:', error);
    return stats;
  }

  stats.total = venues.length;
  console.log(`✅ Found ${stats.total} venues to process\n`);
  console.log('─────────────────────────────────────────────────────\n');

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const cities = venue.cities as any;
    const cityName = cities?.name || 'Unknown';
    const state = cities?.state || '??';

    console.log(`[${i + 1}/${stats.total}] ${venue.name} (${cityName}, ${state})`);

    // Check what's missing
    const needsPhone = !venue.phone;
    const needsWebsite = !venue.website;
    const needsHours = !venue.hours;

    if (!needsPhone && !needsWebsite && !needsHours) {
      console.log(`   ✅ Already has all data, skipping`);
      stats.skipped++;
      continue;
    }

    console.log(`   🔎 Searching OSM... (needs: ${[
      needsPhone && 'phone',
      needsWebsite && 'website',
      needsHours && 'hours'
    ].filter(Boolean).join(', ')})`);

    // Search OpenStreetMap
    const osmData = await searchOSM(venue.name, venue.lat, venue.lng);

    // Rate limit: 1 request per second
    await sleep(1000);

    if (!osmData || !osmData.extratags) {
      console.log(`   ⚠️  No data found in OSM`);
      stats.failed++;
      continue;
    }

    // Check what we found
    const foundPhone = osmData.extratags.phone || osmData.extratags['contact:phone'];
    const foundWebsite = osmData.extratags.website || osmData.extratags['contact:website'];
    const foundHours = osmData.extratags.opening_hours;

    if (!foundPhone && !foundWebsite && !foundHours) {
      console.log(`   ⚠️  OSM has no contact/hours data for this venue`);
      stats.failed++;
      continue;
    }

    console.log(`   ✅ Found: ${[
      foundPhone && `phone (${foundPhone})`,
      foundWebsite && `website`,
      foundHours && `hours`
    ].filter(Boolean).join(', ')}`);

    // Update venue
    const updated = await updateVenue(venue.id, osmData);

    if (updated) {
      stats.updated++;
      if (foundPhone) stats.foundPhone++;
      if (foundWebsite) stats.foundWebsite++;
      if (foundHours) stats.foundHours++;
      console.log(`   💾 Updated successfully`);
    } else {
      stats.failed++;
      console.log(`   ⚠️  Update failed`);
    }

    console.log('');
  }

  // Final report
  console.log('════════════════════════════════════════════════════════');
  console.log('   BACKFILL COMPLETE');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📊 Results:\n`);
  console.log(`Total Processed:     ${stats.total}`);
  console.log(`✅ Updated:          ${stats.updated}`);
  console.log(`⏭️  Skipped:          ${stats.skipped}`);
  console.log(`❌ Failed:           ${stats.failed}`);
  console.log(``);
  console.log(`📞 Found Phones:     ${stats.foundPhone}`);
  console.log(`🌐 Found Websites:   ${stats.foundWebsite}`);
  console.log(`🕒 Found Hours:      ${stats.foundHours}`);
  console.log(``);
  console.log(`📅 Completed: ${new Date().toLocaleString()}\n`);

  return stats;
}

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const offsetArg = args.find(arg => arg.startsWith('--offset='));

const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
const offset = offsetArg ? parseInt(offsetArg.split('=')[1]) : 0;

console.log('\n⚙️  Configuration:');
console.log(`   Limit:  ${limit} venues`);
console.log(`   Offset: ${offset}`);
console.log(`   Rate:   1 request/second (OSM requirement)\n`);

// Run backfill
backfillContactInfo(limit, offset);
