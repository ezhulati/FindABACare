import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

/**
 * Comprehensive Venue Inventory Script
 * Checks database completeness and readiness for production
 *
 * Run with: npx tsx scripts/venue-inventory.ts
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VenueStats {
  totalVenues: number;
  activeVenues: number;
  draftVenues: number;
  withPhotos: number;
  withoutPhotos: number;
  withContact: number;
  withoutContact: number;
  withHours: number;
  withoutHours: number;
  withAmenities: number;
  withoutAmenities: number;
  withSensoryHours: number;
  verified: number;
  unverified: number;
  byCity: Record<string, number>;
  byType: Record<string, number>;
}

interface ProductionReadiness {
  total: number;
  productionReady: number;
  needsImages: number;
  needsContact: number;
  needsHours: number;
  needsAmenities: number;
  venuesNeedingWork: any[];
}

async function getVenueStats(): Promise<VenueStats> {
  console.log('\n📊 Fetching venue statistics...\n');

  // Get all venues
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*, cities(name, state)');

  if (error) {
    console.error('❌ Error fetching venues:', error);
    process.exit(1);
  }

  if (!venues || venues.length === 0) {
    console.log('⚠️  No venues found in database');
    return {
      totalVenues: 0,
      activeVenues: 0,
      draftVenues: 0,
      withPhotos: 0,
      withoutPhotos: 0,
      withContact: 0,
      withoutContact: 0,
      withHours: 0,
      withoutHours: 0,
      withAmenities: 0,
      withoutAmenities: 0,
      withSensoryHours: 0,
      verified: 0,
      unverified: 0,
      byCity: {},
      byType: {}
    };
  }

  const stats: VenueStats = {
    totalVenues: venues.length,
    activeVenues: venues.filter(v => v.status === 'active').length,
    draftVenues: venues.filter(v => v.status === 'draft').length,
    withPhotos: venues.filter(v => v.photo_keys && v.photo_keys.length > 0).length,
    withoutPhotos: venues.filter(v => !v.photo_keys || v.photo_keys.length === 0).length,
    withContact: venues.filter(v => v.phone || v.website).length,
    withoutContact: venues.filter(v => !v.phone && !v.website).length,
    withHours: venues.filter(v => v.hours).length,
    withoutHours: venues.filter(v => !v.hours).length,
    withAmenities: venues.filter(v => v.amenities && Object.keys(v.amenities).length > 0).length,
    withoutAmenities: venues.filter(v => !v.amenities || Object.keys(v.amenities).length === 0).length,
    withSensoryHours: venues.filter(v => v.sensory_hours && v.sensory_hours.length > 0).length,
    verified: venues.filter(v => v.verification_status === 'admin_verified').length,
    unverified: venues.filter(v => v.verification_status !== 'admin_verified').length,
    byCity: {},
    byType: {}
  };

  // Count by city
  venues.forEach(v => {
    const cityName = v.cities?.name || 'Unknown';
    stats.byCity[cityName] = (stats.byCity[cityName] || 0) + 1;
  });

  // Count by type
  venues.forEach(v => {
    const type = v.type || 'Unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
}

async function getProductionReadiness(): Promise<ProductionReadiness> {
  console.log('\n🚀 Checking production readiness...\n');

  const { data: venues, error } = await supabase
    .from('venues')
    .select('*, cities(name, state)')
    .eq('status', 'active');

  if (error || !venues) {
    return {
      total: 0,
      productionReady: 0,
      needsImages: 0,
      needsContact: 0,
      needsHours: 0,
      needsAmenities: 0,
      venuesNeedingWork: []
    };
  }

  const venuesNeedingWork: any[] = [];
  let productionReady = 0;

  venues.forEach(v => {
    const hasPhotos = v.photo_keys && v.photo_keys.length > 0;
    const hasContact = v.phone || v.website;
    const hasHours = !!v.hours;
    const hasAmenities = v.amenities && Object.keys(v.amenities).length > 0;

    const issues: string[] = [];
    if (!hasPhotos) issues.push('No photos');
    if (!hasContact) issues.push('No contact info');
    if (!hasHours) issues.push('No hours');
    if (!hasAmenities) issues.push('No amenities');

    if (issues.length === 0) {
      productionReady++;
    } else {
      venuesNeedingWork.push({
        id: v.id,
        name: v.name,
        slug: v.slug,
        city: v.cities?.name || 'Unknown',
        state: v.cities?.state || '??',
        type: v.type,
        issues: issues,
        hasPhotos,
        hasContact,
        hasHours,
        hasAmenities
      });
    }
  });

  return {
    total: venues.length,
    productionReady,
    needsImages: venues.filter(v => !v.photo_keys || v.photo_keys.length === 0).length,
    needsContact: venues.filter(v => !v.phone && !v.website).length,
    needsHours: venues.filter(v => !v.hours).length,
    needsAmenities: venues.filter(v => !v.amenities || Object.keys(v.amenities).length === 0).length,
    venuesNeedingWork
  };
}

async function getCityBreakdown() {
  console.log('\n🏙️  Fetching city breakdown...\n');

  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name, state, status')
    .eq('status', 'active')
    .order('name');

  if (error || !cities) {
    console.error('❌ Error fetching cities:', error);
    return [];
  }

  const cityStats = await Promise.all(
    cities.map(async (city) => {
      const { count: totalCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id);

      const { count: activeCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('status', 'active');

      const { count: withPhotosCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('status', 'active')
        .not('photo_keys', 'is', null);

      const { count: withAmenitiesCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('status', 'active')
        .not('amenities', 'is', null);

      return {
        name: city.name,
        state: city.state,
        total: totalCount || 0,
        active: activeCount || 0,
        withPhotos: withPhotosCount || 0,
        withAmenities: withAmenitiesCount || 0,
        photoPercentage: activeCount ? Math.round(((withPhotosCount || 0) / activeCount) * 100) : 0,
        amenitiesPercentage: activeCount ? Math.round(((withAmenitiesCount || 0) / activeCount) * 100) : 0
      };
    })
  );

  return cityStats.filter(c => c.total > 0);
}

async function generateReport() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   VENUE INVENTORY & PRODUCTION READINESS REPORT');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`📅 Generated: ${new Date().toLocaleString()}\n`);

  // Get statistics
  const stats = await getVenueStats();
  const readiness = await getProductionReadiness();
  const cityBreakdown = await getCityBreakdown();

  // Overall Statistics
  console.log('═══ OVERALL STATISTICS ═══\n');
  console.log(`Total Venues:        ${stats.totalVenues}`);
  console.log(`├─ Active:           ${stats.activeVenues} (${Math.round((stats.activeVenues / stats.totalVenues) * 100)}%)`);
  console.log(`└─ Draft:            ${stats.draftVenues} (${Math.round((stats.draftVenues / stats.totalVenues) * 100)}%)`);
  console.log('');
  console.log(`Verification Status:`);
  console.log(`├─ Verified:         ${stats.verified} (${Math.round((stats.verified / stats.totalVenues) * 100)}%)`);
  console.log(`└─ Unverified:       ${stats.unverified} (${Math.round((stats.unverified / stats.totalVenues) * 100)}%)`);

  // Production Readiness
  console.log('\n═══ PRODUCTION READINESS ═══\n');
  console.log(`Active Venues:       ${readiness.total}`);
  console.log(`Production Ready:    ${readiness.productionReady} (${Math.round((readiness.productionReady / readiness.total) * 100)}%)`);
  console.log(`Need Work:           ${readiness.venuesNeedingWork.length} (${Math.round((readiness.venuesNeedingWork.length / readiness.total) * 100)}%)`);
  console.log('');
  console.log(`Issues Breakdown:`);
  console.log(`├─ Missing Photos:   ${readiness.needsImages} venues`);
  console.log(`├─ Missing Contact:  ${readiness.needsContact} venues`);
  console.log(`├─ Missing Hours:    ${readiness.needsHours} venues`);
  console.log(`└─ Missing Amenities: ${readiness.needsAmenities} venues`);

  // Data Completeness
  console.log('\n═══ DATA COMPLETENESS ═══\n');
  console.log(`Photos:              ${stats.withPhotos} / ${stats.activeVenues} (${Math.round((stats.withPhotos / stats.activeVenues) * 100)}%)`);
  console.log(`Contact Info:        ${stats.withContact} / ${stats.activeVenues} (${Math.round((stats.withContact / stats.activeVenues) * 100)}%)`);
  console.log(`Hours:               ${stats.withHours} / ${stats.activeVenues} (${Math.round((stats.withHours / stats.activeVenues) * 100)}%)`);
  console.log(`Amenities:           ${stats.withAmenities} / ${stats.activeVenues} (${Math.round((stats.withAmenities / stats.activeVenues) * 100)}%)`);
  console.log(`Sensory Hours:       ${stats.withSensoryHours} / ${stats.activeVenues} (${Math.round((stats.withSensoryHours / stats.activeVenues) * 100)}%)`);

  // Venue Types
  console.log('\n═══ VENUE TYPES ═══\n');
  const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
  sortedTypes.forEach(([type, count]) => {
    const percentage = Math.round((count / stats.totalVenues) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`${type.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%) ${bar}`);
  });

  // City Breakdown
  console.log('\n═══ CITY BREAKDOWN ═══\n');
  console.log('City                 Active  Photos  Amenities');
  console.log('─────────────────────────────────────────────────');
  cityBreakdown
    .sort((a, b) => b.active - a.active)
    .forEach(city => {
      const cityLabel = `${city.name}, ${city.state}`;
      console.log(
        `${cityLabel.padEnd(20)} ${city.active.toString().padStart(6)}  ${city.photoPercentage.toString().padStart(5)}%  ${city.amenitiesPercentage.toString().padStart(8)}%`
      );
    });

  // Venues Needing Work (Top 20)
  if (readiness.venuesNeedingWork.length > 0) {
    console.log('\n═══ VENUES NEEDING WORK (Top 20) ═══\n');
    console.log('Venue Name                         City              Issues');
    console.log('────────────────────────────────────────────────────────────────────────');
    readiness.venuesNeedingWork
      .slice(0, 20)
      .forEach(v => {
        const name = v.name.substring(0, 32).padEnd(34);
        const city = `${v.city}, ${v.state}`.substring(0, 16).padEnd(18);
        const issues = v.issues.join(', ');
        console.log(`${name} ${city} ${issues}`);
      });

    if (readiness.venuesNeedingWork.length > 20) {
      console.log(`\n... and ${readiness.venuesNeedingWork.length - 20} more venues needing work`);
    }
  }

  // Summary & Recommendations
  console.log('\n═══ RECOMMENDATIONS ═══\n');

  const recommendations: string[] = [];

  if (readiness.needsImages > 50) {
    recommendations.push(`⚠️  ${readiness.needsImages} venues missing photos - Consider bulk photo import`);
  }

  if (readiness.needsContact > 100) {
    recommendations.push(`⚠️  ${readiness.needsContact} venues missing contact info - Run backfill script`);
  }

  if (stats.withAmenities < stats.activeVenues * 0.3) {
    recommendations.push(`⚠️  Only ${Math.round((stats.withAmenities / stats.activeVenues) * 100)}% have amenities - Add sensory information`);
  }

  if (stats.withSensoryHours < stats.activeVenues * 0.1) {
    recommendations.push(`⚠️  Only ${stats.withSensoryHours} venues have sensory hours - Research and add special hours`);
  }

  if (recommendations.length === 0) {
    console.log('✅ Database is in good shape for production!');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  // Export detailed CSV
  console.log('\n═══ EXPORTING DETAILED REPORTS ═══\n');

  // CSV of venues needing work
  const csvData = readiness.venuesNeedingWork.map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    city: v.city,
    state: v.state,
    type: v.type,
    has_photos: v.hasPhotos ? 'Yes' : 'No',
    has_contact: v.hasContact ? 'Yes' : 'No',
    has_hours: v.hasHours ? 'Yes' : 'No',
    has_amenities: v.hasAmenities ? 'Yes' : 'No',
    issues: v.issues.join('; ')
  }));

  const csvHeader = 'id,name,slug,city,state,type,has_photos,has_contact,has_hours,has_amenities,issues\n';
  const csvRows = csvData.map(row =>
    `"${row.id}","${row.name}","${row.slug}","${row.city}","${row.state}","${row.type}","${row.has_photos}","${row.has_contact}","${row.has_hours}","${row.has_amenities}","${row.issues}"`
  ).join('\n');

  fs.writeFileSync('venue-inventory-needs-work.csv', csvHeader + csvRows);
  console.log('✅ Exported: venue-inventory-needs-work.csv');

  // City breakdown CSV
  const cityCSV = 'city,state,total,active,with_photos,photo_percentage,with_amenities,amenities_percentage\n' +
    cityBreakdown.map(c =>
      `"${c.name}","${c.state}",${c.total},${c.active},${c.withPhotos},${c.photoPercentage},${c.withAmenities},${c.amenitiesPercentage}`
    ).join('\n');

  fs.writeFileSync('venue-inventory-by-city.csv', cityCSV);
  console.log('✅ Exported: venue-inventory-by-city.csv');

  console.log('\n════════════════════════════════════════════════════════');
  console.log('   END OF REPORT');
  console.log('════════════════════════════════════════════════════════\n');
}

// Run the report
generateReport();
