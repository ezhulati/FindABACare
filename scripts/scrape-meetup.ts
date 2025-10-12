/**
 * Meetup.com Event Scraper
 *
 * Scrapes autism-related events from Meetup.com groups.
 * Note: Meetup deprecated their public API in 2019, so we use web scraping.
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Search terms for finding autism-related groups
const SEARCH_TERMS = [
  'autism support',
  'autism parents',
  'special needs',
  'neurodivergent',
  'ASD support'
];

// Major cities to search
const CITIES = [
  { name: 'Dallas', state: 'TX', slug: 'dallas', lat: 32.7767, lng: -96.7970 },
  { name: 'Houston', state: 'TX', slug: 'houston', lat: 29.7604, lng: -95.3698 },
  { name: 'Austin', state: 'TX', slug: 'austin', lat: 30.2672, lng: -97.7431 },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix', lat: 33.4484, lng: -112.0740 },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'San Diego', state: 'CA', slug: 'san-diego', lat: 32.7157, lng: -117.1611 },
  { name: 'New York', state: 'NY', slug: 'new-york', lat: 40.7128, lng: -74.0060 },
  { name: 'Chicago', state: 'IL', slug: 'chicago', lat: 41.8781, lng: -87.6298 }
];

interface ScrapedEvent {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  venue: string;
  url: string;
  externalId: string;
  groupName: string;
  city: string;
  state: string;
}

/**
 * Scrape Meetup events for a specific search term and city
 */
async function scrapeMeetupCity(
  searchTerm: string,
  city: { name: string; state: string; slug: string; lat: number; lng: number }
): Promise<ScrapedEvent[]> {
  console.log(`\n🔍 Scraping Meetup for "${searchTerm}" in ${city.name}, ${city.state}...`);

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000
  });

  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];

  try {
    // Construct search URL
    const searchUrl = `https://www.meetup.com/find/?keywords=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(city.name + ', ' + city.state)}&source=EVENTS`;

    console.log(`   Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for events to load
    try {
      await page.waitForSelector('[data-testid="event-card"], .event-listing, .searchResults-eventCard', {
        timeout: 10000
      });
    } catch (e) {
      console.log(`   ⚠️  No events found for "${searchTerm}" in ${city.name}`);
      await browser.close();
      return [];
    }

    // Extract event data
    const rawEvents = await page.$$eval(
      '[data-testid="event-card"], .event-listing, .searchResults-eventCard',
      (cards) => {
        return cards.slice(0, 15).map((card) => { // Limit to 15 events per search
          try {
            // Extract title
            const titleEl = card.querySelector('[data-testid="event-title"], h2, h3, .event-title');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL and ID
            const linkEl = card.querySelector('a[href*="/events/"]');
            const url = linkEl?.getAttribute('href') || '';
            const eventIdMatch = url.match(/\/events\/(\d+)/);
            const eventId = eventIdMatch ? eventIdMatch[1] : '';

            // Extract date/time
            const dateEl = card.querySelector('[data-testid="event-time"], time, .event-time');
            const dateText = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '';

            // Extract location
            const locationEl = card.querySelector('[data-testid="event-location"], .event-location');
            const location = locationEl?.textContent?.trim() || '';

            // Extract group name
            const groupEl = card.querySelector('[data-testid="group-name"], .group-name');
            const groupName = groupEl?.textContent?.trim() || '';

            // Extract description
            const descEl = card.querySelector('[data-testid="event-description"], .event-description');
            const description = descEl?.textContent?.trim() || '';

            return {
              title,
              url: url.startsWith('http') ? url : `https://www.meetup.com${url}`,
              eventId,
              dateText,
              location,
              groupName,
              description
            };
          } catch (err) {
            console.error('Error parsing event card:', err);
            return null;
          }
        }).filter(Boolean);
      }
    );

    console.log(`   Found ${rawEvents.length} potential events`);

    // Process and format events
    for (const rawEvent of rawEvents) {
      if (!rawEvent || !rawEvent.eventId) continue;

      try {
        // Parse date and time
        let eventDate = dayjs();
        let startTime = '18:00';
        let endTime = '20:00';

        if (rawEvent.dateText) {
          // Try to parse date
          const parsed = dayjs(rawEvent.dateText);
          if (parsed.isValid()) {
            eventDate = parsed;
            startTime = parsed.format('HH:mm');
            endTime = parsed.add(2, 'hour').format('HH:mm');
          }
        }

        // Extract venue name from location
        const venueName = rawEvent.location.split(',')[0].trim() || rawEvent.location || 'Online Event';

        const event: ScrapedEvent = {
          title: rawEvent.title,
          description: rawEvent.description || rawEvent.title,
          date: eventDate.format('YYYY-MM-DD'),
          startTime,
          endTime,
          location: rawEvent.location || 'Online',
          venue: venueName,
          url: rawEvent.url,
          externalId: `meetup-${rawEvent.eventId}`,
          groupName: rawEvent.groupName,
          city: city.name,
          state: city.state
        };

        events.push(event);
        console.log(`   ✅ ${event.title} (${event.groupName})`);

      } catch (err) {
        console.error(`   ❌ Error processing event:`, err);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error scraping ${city.name}:`, error);
  } finally {
    await browser.close();
  }

  return events;
}

/**
 * Find or create a city in the database
 */
async function findCity(cityName: string, state: string): Promise<{ id: string; slug: string } | null> {
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
 * Find or create a venue in the database
 */
async function findOrCreateVenue(
  venueName: string,
  location: string,
  cityId: string
): Promise<string | null> {
  // Try to find existing venue by name
  const { data: existingVenue } = await supabase
    .from('venues')
    .select('id')
    .eq('city_id', cityId)
    .ilike('name', `%${venueName}%`)
    .single();

  if (existingVenue) {
    return existingVenue.id;
  }

  // Create placeholder venue
  const slug = venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data: newVenue, error } = await supabase
    .from('venues')
    .insert({
      name: venueName,
      address: location,
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

  console.log(`   ➕ Created placeholder venue: ${venueName}`);
  return newVenue.id;
}

/**
 * Import events to the database
 */
async function importEvents(events: ScrapedEvent[]): Promise<void> {
  console.log(`\n📥 Importing ${events.length} events to database...\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    try {
      // Check if event already exists
      const { data: existing } = await supabase
        .from('events')
        .select('id, last_synced_at')
        .eq('external_id', event.externalId)
        .single();

      if (existing) {
        // Update last_synced_at
        await supabase
          .from('events')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', existing.id);

        console.log(`   ⏭️  Already exists: ${event.title}`);
        skipped++;
        continue;
      }

      // Find city
      const city = await findCity(event.city, event.state);
      if (!city) {
        console.log(`   ⚠️  City not found: ${event.city}, ${event.state}`);
        errors++;
        continue;
      }

      // Find or create venue
      const venueId = await findOrCreateVenue(event.venue, event.location, city.id);
      if (!venueId) {
        console.log(`   ⚠️  Could not create venue: ${event.venue}`);
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
          event_type: 'partner',
          source_url: event.url,
          source_name: `Meetup - ${event.groupName}`,
          external_id: event.externalId,
          status: 'published',
          approval_status: 'approved',
          scraped_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`   ❌ Error inserting ${event.title}:`, insertError.message);
        errors++;
      } else {
        console.log(`   ✅ Imported: ${event.title}`);
        imported++;
      }

    } catch (err) {
      console.error(`   ❌ Error processing ${event.title}:`, err);
      errors++;
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🎯 Starting Meetup.com Event Scraper\n');

  const allEvents: ScrapedEvent[] = [];

  // Scrape all cities with different search terms
  for (const city of CITIES) {
    for (const searchTerm of SEARCH_TERMS) {
      const events = await scrapeMeetupCity(searchTerm, city);
      allEvents.push(...events);

      // Add delay between searches to be respectful
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n✨ Total events found: ${allEvents.length}`);

  if (allEvents.length === 0) {
    console.log('\n⚠️  No events to import');
    return;
  }

  // Remove duplicates by external_id
  const uniqueEvents = Array.from(
    new Map(allEvents.map(e => [e.externalId, e])).values()
  );

  console.log(`✨ Unique events after deduplication: ${uniqueEvents.length}`);

  // Import events to database
  await importEvents(uniqueEvents);

  console.log('\n✅ Meetup scraping complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { scrapeMeetupCity, importEvents };
