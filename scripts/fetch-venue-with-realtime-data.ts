import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface PopularTime {
  day: number; // 0-6 (Sunday-Saturday)
  data: number[]; // 24 hours, 0-100 crowd level
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  // Note: popular_times is not officially documented but often available
  popular_times?: PopularTime[];
  current_popularity?: number;
}

async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'geometry',
    'rating',
    'user_ratings_total',
    'opening_hours',
    'photos',
    'reviews',
    'current_opening_hours',
    'editorial_summary'
  ].join(',');

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else {
      console.error('Place Details error:', data.status, data.error_message);
      return null;
    }
  } catch (error: any) {
    console.error('Failed to fetch place details:', error.message);
    return null;
  }
}

// For popular times, we need to use an unofficial endpoint or third-party service
// Popular Times Widget (https://github.com/m-wrzr/populartimes) extracts this data
async function getPopularTimes(placeId: string): Promise<PopularTime[] | null> {
  // Option 1: Use unofficial Google endpoint (may break)
  // Option 2: Use third-party service like Outscraper
  // Option 3: Build our own data collection via user check-ins

  // For now, return null and we'll build check-in system
  return null;
}

function analyzeCalmWindows(popularTimes: PopularTime[]): Array<{
  day: number;
  start_hour: number;
  end_hour: number;
  crowd_level: string;
}> {
  const calmWindows: Array<{
    day: number;
    start_hour: number;
    end_hour: number;
    crowd_level: string;
  }> = [];

  for (const dayData of popularTimes) {
    let windowStart: number | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const crowdLevel = dayData.data[hour] || 0;

      // Define "calm" as crowd level < 30
      if (crowdLevel < 30 && crowdLevel > 0) {
        if (windowStart === null) {
          windowStart = hour;
        }
      } else {
        if (windowStart !== null) {
          calmWindows.push({
            day: dayData.day,
            start_hour: windowStart,
            end_hour: hour,
            crowd_level: 'quiet'
          });
          windowStart = null;
        }
      }
    }

    // Close any open window at end of day
    if (windowStart !== null) {
      calmWindows.push({
        day: dayData.day,
        start_hour: windowStart,
        end_hour: 24,
        crowd_level: 'quiet'
      });
    }
  }

  return calmWindows;
}

async function syncVenueData(venueId: string, googlePlaceId: string) {
  console.log(`\nSyncing venue ${venueId}...`);

  // Fetch complete place details
  const details = await getPlaceDetails(googlePlaceId);
  if (!details) {
    console.log('  ✗ Failed to fetch place details');
    return;
  }

  // Update venue with real data
  const { error: venueError } = await supabase
    .from('venues')
    .update({
      google_place_id: details.place_id,
      google_rating: details.rating,
      google_review_count: details.user_ratings_total,
      is_open_now: details.opening_hours?.open_now,
      hours: details.opening_hours?.weekday_text,
      last_synced_at: new Date().toISOString()
    })
    .eq('id', venueId);

  if (venueError) {
    console.log('  ✗ Error updating venue:', venueError.message);
    return;
  }

  console.log('  ✓ Venue data synced');

  // Try to get popular times
  const popularTimes = await getPopularTimes(googlePlaceId);
  if (popularTimes && popularTimes.length > 0) {
    // Analyze and store calm windows
    const calmWindows = analyzeCalmWindows(popularTimes);

    console.log(`  ✓ Found ${calmWindows.length} calm windows`);

    // Store calm windows in database
    for (const window of calmWindows) {
      await supabase.from('calm_windows').insert({
        venue_id: venueId,
        day_of_week: window.day,
        start_time: `${window.start_hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${window.end_hour.toString().padStart(2, '0')}:00:00`,
        crowd_level: window.crowd_level,
        data_source: 'google_places',
        confidence_score: 0.7,
      });
    }
  } else {
    console.log('  ⚠️  Popular times not available');
  }
}

async function main() {
  console.log('Syncing venue data from Google Places');
  console.log('='.repeat(50));

  // Get all venues with Google Place IDs
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, google_place_id')
    .not('google_place_id', 'is', null)
    .limit(10); // Start with 10 for testing

  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }

  console.log(`Found ${venues?.length || 0} venues to sync\n`);

  for (const venue of venues || []) {
    await syncVenueData(venue.id, venue.google_place_id);

    // Rate limit: 50 requests per second max
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Sync complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getPlaceDetails, analyzeCalmWindows };
