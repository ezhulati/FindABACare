/**
 * Eventbrite Event Scraper
 *
 * Scrapes autism-related events from Eventbrite and imports them to the database.
 * Uses Playwright for web scraping and the event categorizer for filtering.
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { categorizeEvent } from './event-categorizer.js';
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

// Major cities to scrape
const CITIES = [
  { name: 'Dallas', state: 'TX', slug: 'dallas' },
  { name: 'Houston', state: 'TX', slug: 'houston' },
  { name: 'Austin', state: 'TX', slug: 'austin' },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix' },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles' },
  { name: 'San Diego', state: 'CA', slug: 'san-diego' },
  { name: 'New York', state: 'NY', slug: 'new-york' },
  { name: 'Chicago', state: 'IL', slug: 'chicago' }
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
  city: string;
  state: string;
}

/**
 * Scrape events from Eventbrite for a specific city
 */
async function scrapeEventbriteCity(city: string, state: string): Promise<ScrapedEvent[]> {
  console.log(`\n🔍 Scraping Eventbrite for ${city}, ${state}...`);

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000
  });

  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];

  try {
    // Construct search URL - search for "autism" events in the city
    const searchUrl = `https://www.eventbrite.com/d/${city.toLowerCase().replace(/\s+/g, '-')}--${state.toLowerCase()}/autism/`;

    console.log(`   Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for events to load (Eventbrite uses various selectors, try multiple)
    try {
      await page.waitForSelector('[data-testid="search-event-card"], .search-event-card-wrapper, .event-card', {
        timeout: 10000
      });
    } catch (e) {
      console.log(`   ⚠️  No events found for ${city}`);
      await browser.close();
      return [];
    }

    // Extract event data
    const rawEvents = await page.$$eval(
      '[data-testid="search-event-card"], .search-event-card-wrapper, .event-card',
      (cards) => {
        return cards.slice(0, 20).map((card) => { // Limit to 20 events per city
          try {
            // Extract title
            const titleEl = card.querySelector('[data-testid="event-card-title"], .event-card__title, h2, h3');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL and ID
            const linkEl = card.querySelector('a[href*="/e/"]');
            const url = linkEl?.getAttribute('href') || '';
            const eventIdMatch = url.match(/\/e\/[^\/]+-(\d+)/);
            const eventId = eventIdMatch ? eventIdMatch[1] : '';

            // Extract date/time
            const dateEl = card.querySelector('[data-testid="event-card-date"], .event-card__date, time');
            const dateText = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '';

            // Extract location/venue
            const locationEl = card.querySelector('[data-testid="event-card-location"], .event-card__location, .card-text--truncated__three');
            const location = locationEl?.textContent?.trim() || '';

            // Extract description (if available)
            const descEl = card.querySelector('[data-testid="event-card-description"], .event-card__description');
            const description = descEl?.textContent?.trim() || '';

            return {
              title,
              url: url.startsWith('http') ? url : `https://www.eventbrite.com${url}`,
              eventId,
              dateText,
              location,
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
        let endTime = '21:00';

        if (rawEvent.dateText) {
          // Try various date formats
          const formats = [
            'MMM D, YYYY, h:mm A',
            'MMMM D, YYYY, h:mm A',
            'ddd, MMM D, YYYY, h:mm A',
            'ddd, MMMM D, YYYY, h:mm A'
          ];

          for (const format of formats) {
            const parsed = dayjs(rawEvent.dateText, format);
            if (parsed.isValid()) {
              eventDate = parsed;
              startTime = parsed.format('HH:mm');
              // Default 3 hour duration
              endTime = parsed.add(3, 'hour').format('HH:mm');
              break;
            }
          }
        }

        // Extract venue name from location
        const venueName = rawEvent.location.split(',')[0].trim() || rawEvent.location;

        const event: ScrapedEvent = {
          title: rawEvent.title,
          description: rawEvent.description || rawEvent.title,
          date: eventDate.format('YYYY-MM-DD'),
          startTime,
          endTime,
          location: rawEvent.location,
          venue: venueName,
          url: rawEvent.url,
          externalId: `eventbrite-${rawEvent.eventId}`,
          city,
          state
        };

        // Categorize event using the categorizer
        const categorization = categorizeEvent({
          title: event.title,
          description: event.description,
          tags: []
        });

        // Only add if autism-relevant with medium or high confidence
        if (categorization.isAutismRelevant && categorization.confidence !== 'low') {
          events.push(event);
          console.log(`   ✅ ${event.title} (confidence: ${categorization.confidence})`);
        } else {
          console.log(`   ⏭️  Skipped: ${event.title} (not autism-relevant)`);
        }

      } catch (err) {
        console.error(`   ❌ Error processing event:`, err);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error scraping ${city}:`, error);
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
      slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
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
        // Update last_synced_at to indicate we checked it
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
          source_name: 'Eventbrite',
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
  console.log('🎯 Starting Eventbrite Event Scraper\n');

  const allEvents: ScrapedEvent[] = [];

  // Scrape all cities
  for (const city of CITIES) {
    const events = await scrapeEventbriteCity(city.name, city.state);
    allEvents.push(...events);

    // Add delay between cities to be respectful to Eventbrite
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✨ Total autism-relevant events found: ${allEvents.length}`);

  if (allEvents.length === 0) {
    console.log('\n⚠️  No events to import');
    return;
  }

  // Import events to database
  await importEvents(allEvents);

  console.log('\n✅ Eventbrite scraping complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { scrapeEventbriteCity, importEvents };
