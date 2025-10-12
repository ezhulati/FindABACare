/**
 * Autism Speaks Event Scraper
 *
 * Scrapes events from Autism Speaks (autismspeaks.org/events)
 * Includes walks, fundraisers, and family events
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
 * Scrape Autism Speaks events
 */
async function scrapeAutismSpeaksEvents(): Promise<ScrapedEvent[]> {
  console.log('\n🔍 Scraping Autism Speaks events...');

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000
  });

  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];

  try {
    const searchUrl = 'https://www.autismspeaks.org/events';

    console.log(`   Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for events to load
    try {
      await page.waitForSelector('.event-item, .view-events .views-row, article', {
        timeout: 10000
      });
    } catch (e) {
      console.log('   ⚠️  No events found on Autism Speaks');
      await browser.close();
      return [];
    }

    // Extract event data
    const rawEvents = await page.$$eval(
      '.event-item, .view-events .views-row, article',
      (cards) => {
        return cards.slice(0, 50).map((card) => {
          try {
            // Extract title
            const titleEl = card.querySelector('h2, h3, .title, a');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL
            const linkEl = card.querySelector('a[href*="/event/"], a[href*="autism"]');
            const url = linkEl?.getAttribute('href') || '';

            // Extract date
            const dateEl = card.querySelector('.date, .field-name-field-event-date, time');
            const dateText = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '';

            // Extract location
            const locationEl = card.querySelector('.location, .field-name-field-location, .address');
            const location = locationEl?.textContent?.trim() || '';

            // Extract description
            const descEl = card.querySelector('.description, .field-name-body, .summary, p');
            const description = descEl?.textContent?.trim() || '';

            return {
              title,
              url: url.startsWith('http') ? url : `https://www.autismspeaks.org${url}`,
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
      if (!rawEvent || !rawEvent.title) continue;

      try {
        // Parse location to extract city and state
        let city = '';
        let state = '';
        let venue = rawEvent.location || 'TBD';

        // Try to extract city/state from location string
        // Common formats: "Dallas, TX", "Dallas, Texas", "123 Main St, Dallas, TX"
        const locationMatch = rawEvent.location.match(/([A-Za-z\s]+),\s*([A-Z]{2})/);
        if (locationMatch) {
          const possibleCity = locationMatch[1].trim();
          state = locationMatch[2];

          // If there's a comma before the city, it's likely an address
          const parts = rawEvent.location.split(',');
          if (parts.length >= 2) {
            city = parts[parts.length - 2].trim();
            venue = parts[0].trim();
          } else {
            city = possibleCity;
          }
        }

        // Skip if we couldn't extract city/state
        if (!city || !state) {
          console.log(`   ⏭️  Skipped (no location): ${rawEvent.title}`);
          continue;
        }

        // Parse date and time
        let eventDate = dayjs();
        let startTime = '10:00';
        let endTime = '14:00';

        if (rawEvent.dateText) {
          // Try various date formats
          const formats = [
            'MMMM D, YYYY',
            'MMM D, YYYY',
            'MM/DD/YYYY',
            'YYYY-MM-DD'
          ];

          for (const format of formats) {
            const parsed = dayjs(rawEvent.dateText, format);
            if (parsed.isValid()) {
              eventDate = parsed;
              break;
            }
          }

          // Check if time is in the date text
          const timeMatch = rawEvent.dateText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            const period = timeMatch[3].toLowerCase();

            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;

            startTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            endTime = dayjs(`${startTime}`, 'HH:mm').add(4, 'hour').format('HH:mm');
          }
        }

        // Skip past events
        if (eventDate.isBefore(dayjs(), 'day')) {
          console.log(`   ⏭️  Skipped (past event): ${rawEvent.title}`);
          continue;
        }

        // Generate external ID from URL or title
        const urlMatch = rawEvent.url.match(/\/event\/([^\/]+)/);
        const externalId = urlMatch ? `autism-speaks-${urlMatch[1]}` : `autism-speaks-${rawEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        const event: ScrapedEvent = {
          title: rawEvent.title,
          description: rawEvent.description || rawEvent.title,
          date: eventDate.format('YYYY-MM-DD'),
          startTime,
          endTime,
          location: rawEvent.location,
          venue,
          url: rawEvent.url,
          externalId,
          city,
          state
        };

        events.push(event);
        console.log(`   ✅ ${event.title} (${event.city}, ${event.state})`);

      } catch (err) {
        console.error(`   ❌ Error processing event:`, err);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error scraping Autism Speaks:`, error);
  } finally {
    await browser.close();
  }

  return events;
}

/**
 * Find or create a city in the database
 */
async function findCity(cityName: string, state: string): Promise<{ id: string; slug: string } | null> {
  const { data: city, error} = await supabase
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
          source_name: 'Autism Speaks',
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
  console.log('🎯 Starting Autism Speaks Event Scraper\n');

  const events = await scrapeAutismSpeaksEvents();

  console.log(`\n✨ Total events found: ${events.length}`);

  if (events.length === 0) {
    console.log('\n⚠️  No events to import');
    return;
  }

  // Import events to database
  await importEvents(events);

  console.log('\n✅ Autism Speaks scraping complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { scrapeAutismSpeaksEvents, importEvents };
