import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

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
  externalId: string;
  ageRange?: string;
  capacity?: number;
}

async function scrapeFindingyallEvents(): Promise<ScrapedEvent[]> {
  console.log('🚀 Starting Finding Y\'all event scraper...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to Finding Y\'all events page...');
    await page.goto('https://www.findingyall.org/finding-yall-upcoming-events', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('🔍 Extracting event data...');

    // Wait for event containers to load
    await page.waitForSelector('.eventlist-event', { timeout: 10000 });

    const events = await page.$$eval('.eventlist-event', (elements) => {
      return elements.map((el, index) => {
        // Extract title
        const titleEl = el.querySelector('.eventlist-title');
        const title = titleEl?.textContent?.trim() || '';

        // Extract date/time
        const dateEl = el.querySelector('.event-date');
        const dateText = dateEl?.textContent?.trim() || '';

        // Extract description
        const descEl = el.querySelector('.eventlist-description');
        const description = descEl?.textContent?.trim() || '';

        // Extract location
        const locationEl = el.querySelector('.eventlist-meta-address-maplink');
        const location = locationEl?.textContent?.trim() || '';

        // Generate external ID from title + index for uniqueness
        const externalId = `findingyall-${title.toLowerCase().replace(/\s+/g, '-')}-${index}`;

        return {
          title,
          description,
          dateText,
          location,
          externalId
        };
      });
    });

    console.log(`✅ Found ${events.length} events\n`);

    // Parse and format events
    const formattedEvents: ScrapedEvent[] = [];

    for (const event of events) {
      try {
        // Parse date from text like "October 18, 2025" or "8:00 PM - 9:30 PM"
        // This is a simplified parser - may need adjustment based on actual format
        const dateMatch = event.dateText.match(/(\w+\s+\d+,\s+\d{4})/);
        const timeMatch = event.dateText.match(/(\d+:\d+\s+[AP]M)\s*-\s*(\d+:\d+\s+[AP]M)/);

        if (dateMatch) {
          const parsedDate = dayjs(dateMatch[1]);

          let startTime = '18:00'; // Default 6 PM
          let endTime = '21:00'; // Default 9 PM

          if (timeMatch) {
            const start = dayjs(timeMatch[1], 'h:mm A');
            const end = dayjs(timeMatch[2], 'h:mm A');
            startTime = start.format('HH:mm');
            endTime = end.format('HH:mm');
          }

          formattedEvents.push({
            title: event.title,
            description: event.description,
            date: parsedDate.format('YYYY-MM-DD'),
            startTime,
            endTime,
            location: event.location,
            externalId: event.externalId,
            ageRange: '3-12', // Default for Finding Y'all events
            capacity: 12 // Default capacity
          });
        }
      } catch (err) {
        console.warn(`⚠️  Failed to parse event: ${event.title}`, err);
      }
    }

    await browser.close();
    return formattedEvents;

  } catch (error) {
    console.error('❌ Error scraping events:', error);
    await browser.close();
    return [];
  }
}

async function findOrCreateVenue(location: string, cityId: string): Promise<string | null> {
  // Try to find existing venue by name
  const { data: existingVenue } = await supabase
    .from('venues')
    .select('id')
    .eq('city_id', cityId)
    .ilike('name', `%${location.split(',')[0].trim()}%`)
    .single();

  if (existingVenue) {
    return existingVenue.id;
  }

  // For now, return null if venue doesn't exist
  // In production, you might want to create a placeholder venue or use Google Places API
  console.log(`⚠️  Venue not found: ${location}`);
  return null;
}

async function importEvents(events: ScrapedEvent[], citySlug: string, state: string) {
  console.log(`\n📥 Importing ${events.length} events to database...\n`);

  // Get city ID
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .eq('state', state)
    .single();

  if (!city) {
    console.error(`❌ City not found: ${citySlug}, ${state}`);
    return;
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    try {
      // Check if event already exists by external_id
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('external_id', event.externalId)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${event.title}`);
        skipped++;
        continue;
      }

      // Find or create venue
      const venueId = await findOrCreateVenue(event.location, city.id);

      if (!venueId) {
        console.log(`⚠️  Skipping event (no venue): ${event.title}`);
        skipped++;
        continue;
      }

      // Insert event
      const { error } = await supabase
        .from('events')
        .insert({
          title: event.title,
          description: event.description,
          date: event.date,
          start_time: event.startTime,
          end_time: event.endTime,
          venue_id: venueId,
          city_id: city.id,
          capacity: event.capacity,
          age_range: event.ageRange,
          event_type: 'partner',
          source_url: 'https://www.findingyall.org/finding-yall-upcoming-events',
          source_name: 'Finding Y\'all',
          external_id: event.externalId,
          status: 'published',
          approval_status: 'approved',
          scraped_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error importing: ${event.title}`, error.message);
        errors++;
      } else {
        console.log(`✅ Imported: ${event.title}`);
        imported++;
      }

    } catch (err) {
      console.error(`❌ Error processing: ${event.title}`, err);
      errors++;
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const citySlug = args.find(arg => arg.startsWith('--city='))?.split('=')[1] || 'dallas';
  const state = args.find(arg => arg.startsWith('--state='))?.split('=')[1] || 'TX';

  console.log(`🎯 Target City: ${citySlug}, ${state}\n`);

  // Scrape events
  const events = await scrapeFindingyallEvents();

  if (events.length === 0) {
    console.log('⚠️  No events found or scraping failed');
    return;
  }

  // Import to database
  await importEvents(events, citySlug, state);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use in maintain-events.ts
export { scrapeFindingyallEvents, importEvents };
