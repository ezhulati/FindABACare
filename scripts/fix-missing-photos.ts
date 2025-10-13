import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

/**
 * Identify and Fix Venues Missing Photos
 *
 * Generates a report of the 52 venues without photos and provides
 * options for fixing them (placeholder images or manual upload instructions)
 *
 * Run with: npx tsx scripts/fix-missing-photos.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VenueMissingPhoto {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  website?: string;
}

// Placeholder image URLs by venue type
const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  museum: [
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',  // Museum interior
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800'   // Art museum
  ],
  park: [
    'https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?w=800',  // Park scenery
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'   // Nature park
  ],
  library: [
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',  // Library interior
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'   // Modern library
  ],
  recreation: [
    'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800',  // Rec center
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'   // Gym/fitness
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',  // Restaurant interior
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'   // Dining
  ],
  theater: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',  // Theater seats
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800'   // Movie theater
  ],
  zoo: [
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',  // Zoo animals
    'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800'   // Zoo entrance
  ],
  aquarium: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',  // Aquarium tank
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'   // Ocean life
  ],
  gym: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',  // Gym equipment
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'   // Fitness center
  ],
  other: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',  // Building exterior
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'   // Modern building
  ]
};

async function getVenuesMissingPhotos(): Promise<VenueMissingPhoto[]> {
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, type, lat, lng, website, photo_keys, cities(name, state)')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Error fetching venues:', error);
    return [];
  }

  // Filter in JavaScript for venues without photos
  const venuesWithoutPhotos = venues?.filter(v =>
    !v.photo_keys || v.photo_keys.length === 0
  ) || [];

  return venuesWithoutPhotos.map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    type: (v.type || 'other').toLowerCase(),
    city: v.cities?.name || 'Unknown',
    state: v.cities?.state || '??',
    latitude: v.lat,
    longitude: v.lng,
    website: v.website
  }));
}

async function addPlaceholderPhoto(venueId: string, venueType: string): Promise<boolean> {
  try {
    // Get random placeholder for this venue type
    const placeholders = PLACEHOLDER_IMAGES[venueType] || PLACEHOLDER_IMAGES.other;
    const randomImage = placeholders[Math.floor(Math.random() * placeholders.length)];

    // Update venue with placeholder photo_keys
    // Note: We're storing the URL directly, not uploading to Supabase Storage
    // This is intentional to use free Unsplash images
    const { error } = await supabase
      .from('venues')
      .update({
        photo_keys: [randomImage]
      })
      .eq('id', venueId);

    if (error) {
      console.error(`   ⚠️  Failed to update venue: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`   ⚠️  Error adding placeholder:`, error);
    return false;
  }
}

async function generateReport() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   MISSING PHOTOS REPORT & FIX TOOL');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📅 Generated: ${new Date().toLocaleString()}\n`);

  console.log('🔍 Finding venues without photos...\n');

  const venues = await getVenuesMissingPhotos();

  if (venues.length === 0) {
    console.log('✅ All venues have photos! Nothing to fix.\n');
    return;
  }

  console.log(`Found ${venues.length} venues missing photos:\n`);
  console.log('─────────────────────────────────────────────────────\n');

  // Group by type
  const byType: Record<string, VenueMissingPhoto[]> = {};
  venues.forEach(v => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });

  // Display summary by type
  console.log('📊 Breakdown by Type:\n');
  Object.entries(byType)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, list]) => {
      console.log(`   ${type.padEnd(15)} ${list.length} venues`);
    });

  console.log('\n─────────────────────────────────────────────────────\n');
  console.log('📝 Detailed List:\n');

  venues.forEach((v, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${v.name}`);
    console.log(`    Type: ${v.type} | Location: ${v.city}, ${v.state}`);
    console.log(`    Slug: /venue/${v.slug}`);
    if (v.website) {
      console.log(`    Website: ${v.website}`);
    }
    console.log('');
  });

  // Export CSV
  const csvHeader = 'id,name,slug,type,city,state,website,google_maps_link\n';
  const csvRows = venues.map(v =>
    `"${v.id}","${v.name}","${v.slug}","${v.type}","${v.city}","${v.state}","${v.website || ''}","https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}"`
  ).join('\n');

  fs.writeFileSync('venues-missing-photos.csv', csvHeader + csvRows);
  console.log('═══ EXPORT ═══\n');
  console.log('✅ Exported: venues-missing-photos.csv');
  console.log('   This file contains all venues with Google Maps links\n');

  console.log('═══ OPTIONS TO FIX ═══\n');
  console.log('1️⃣  AUTO-ADD PLACEHOLDERS (Recommended for Quick Fix)');
  console.log('   Run: npx tsx scripts/fix-missing-photos.ts --add-placeholders');
  console.log('   This will add generic stock photos from Unsplash\n');

  console.log('2️⃣  MANUAL PHOTO UPLOAD');
  console.log('   - Open venues-missing-photos.csv');
  console.log('   - Click Google Maps links to find each venue');
  console.log('   - Download photos and upload via admin dashboard\n');

  console.log('3️⃣  SCRAPE FROM GOOGLE (Requires API Key - Costs Money)');
  console.log('   - Re-enable scripts/fetch-venue-photos.ts');
  console.log('   - WARNING: This will incur Google API charges\n');

  console.log('════════════════════════════════════════════════════════\n');
}

async function addPlaceholdersToAll() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   AUTO-ADDING PLACEHOLDER PHOTOS');
  console.log('════════════════════════════════════════════════════════\n');

  const venues = await getVenuesMissingPhotos();

  if (venues.length === 0) {
    console.log('✅ All venues already have photos!\n');
    return;
  }

  console.log(`📸 Adding placeholders to ${venues.length} venues...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    console.log(`[${i + 1}/${venues.length}] ${venue.name} (${venue.type})`);

    const added = await addPlaceholderPhoto(venue.id, venue.type);

    if (added) {
      success++;
      console.log(`   ✅ Added placeholder photo`);
    } else {
      failed++;
      console.log(`   ❌ Failed to add placeholder`);
    }
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('   COMPLETE');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`\n📊 Photo Coverage: ${Math.round((success / venues.length) * 100)}%\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const addPlaceholders = args.includes('--add-placeholders');

if (addPlaceholders) {
  addPlaceholdersToAll();
} else {
  generateReport();
}
