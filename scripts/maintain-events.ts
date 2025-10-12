/**
 * Event Maintenance Script
 *
 * Automated maintenance tasks for the events system:
 * - Runs all event scrapers (Finding Y'all, Eventbrite)
 * - Removes past events
 * - Updates last_synced_at timestamps
 * - Checks for event changes/cancellations
 * - Comprehensive logging
 */

import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MaintenanceStats {
  findingYallEvents: number;
  eventbriteEvents: number;
  pastEventsRemoved: number;
  eventsUpdated: number;
  errors: string[];
}

/**
 * Remove past events from the database
 */
async function removePastEvents(): Promise<number> {
  console.log('\n🗑️  Removing past events...');

  const today = dayjs().format('YYYY-MM-DD');

  const { data: pastEvents, error: selectError } = await supabase
    .from('events')
    .select('id, title, date')
    .lt('date', today);

  if (selectError) {
    console.error('   ❌ Error fetching past events:', selectError);
    throw selectError;
  }

  if (!pastEvents || pastEvents.length === 0) {
    console.log('   ✅ No past events to remove');
    return 0;
  }

  console.log(`   Found ${pastEvents.length} past events`);

  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .lt('date', today);

  if (deleteError) {
    console.error('   ❌ Error deleting past events:', deleteError);
    throw deleteError;
  }

  console.log(`   ✅ Removed ${pastEvents.length} past events`);
  return pastEvents.length;
}

/**
 * Check if events still exist and are not cancelled
 * For now, we just update last_synced_at for partner events
 */
async function updatePartnerEventsSyncTime(): Promise<number> {
  console.log('\n🔄 Updating partner events sync time...');

  const { data: partnerEvents, error: selectError } = await supabase
    .from('events')
    .select('id, title, external_id')
    .eq('event_type', 'partner')
    .gte('date', dayjs().format('YYYY-MM-DD'));

  if (selectError) {
    console.error('   ❌ Error fetching partner events:', selectError);
    throw selectError;
  }

  if (!partnerEvents || partnerEvents.length === 0) {
    console.log('   ✅ No partner events to update');
    return 0;
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('event_type', 'partner')
    .gte('date', dayjs().format('YYYY-MM-DD'));

  if (updateError) {
    console.error('   ❌ Error updating partner events:', updateError);
    throw updateError;
  }

  console.log(`   ✅ Updated ${partnerEvents.length} partner events`);
  return partnerEvents.length;
}

/**
 * Run Finding Y'all scraper
 */
async function runFindingYallScraper(): Promise<number> {
  console.log('\n📍 Running Finding Y\'all scraper...');

  try {
    // Import and run the Finding Y'all scraper
    const { scrapeFindingyallEvents, importEvents } = await import('./scrape-findingyall-events.js');

    // Scrape events
    const events = await scrapeFindingyallEvents();

    if (!events || events.length === 0) {
      console.log('   ⚠️  No new Finding Y\'all events found');
      return 0;
    }

    // Import events (using the built-in import function from the scraper)
    await importEvents(events, 'dallas', 'TX');

    return events.length;

  } catch (error) {
    console.error('   ❌ Error running Finding Y\'all scraper:', error);
    throw error;
  }
}

/**
 * Run Eventbrite scraper
 */
async function runEventbriteScraper(): Promise<number> {
  console.log('\n📍 Running Eventbrite scraper...');

  try {
    // Import and run the Eventbrite scraper
    const module = await import('./scrape-eventbrite.js');
    const { scrapeEventbriteCity, importEvents } = module;

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

    const allEvents: any[] = [];

    // Scrape each city
    for (const city of CITIES) {
      try {
        const events = await scrapeEventbriteCity(city.name, city.state);
        allEvents.push(...events);

        // Add delay between cities
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`   ⚠️  Error scraping ${city.name}:`, err);
      }
    }

    if (allEvents.length === 0) {
      console.log('   ⚠️  No new Eventbrite events found');
      return 0;
    }

    // Import events using the built-in import function
    await importEvents(allEvents);

    console.log(`   📊 Eventbrite: Found ${allEvents.length} events`);
    return allEvents.length;

  } catch (error) {
    console.error('   ❌ Error running Eventbrite scraper:', error);
    throw error;
  }
}

/**
 * Main maintenance function
 */
async function maintainEvents(): Promise<MaintenanceStats> {
  console.log('🔧 Starting Event Maintenance\n');
  console.log(`📅 Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`);

  const stats: MaintenanceStats = {
    findingYallEvents: 0,
    eventbriteEvents: 0,
    pastEventsRemoved: 0,
    eventsUpdated: 0,
    errors: []
  };

  // Step 1: Remove past events
  try {
    stats.pastEventsRemoved = await removePastEvents();
  } catch (error) {
    const message = `Failed to remove past events: ${error}`;
    console.error(message);
    stats.errors.push(message);
  }

  // Step 2: Run Finding Y'all scraper
  try {
    stats.findingYallEvents = await runFindingYallScraper();
  } catch (error) {
    const message = `Finding Y'all scraper failed: ${error}`;
    console.error(message);
    stats.errors.push(message);
  }

  // Step 3: Run Eventbrite scraper
  try {
    stats.eventbriteEvents = await runEventbriteScraper();
  } catch (error) {
    const message = `Eventbrite scraper failed: ${error}`;
    console.error(message);
    stats.errors.push(message);
  }

  // Step 4: Update partner events sync time
  try {
    stats.eventsUpdated = await updatePartnerEventsSyncTime();
  } catch (error) {
    const message = `Failed to update partner events: ${error}`;
    console.error(message);
    stats.errors.push(message);
  }

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 MAINTENANCE SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`🗑️  Past events removed: ${stats.pastEventsRemoved}`);
  console.log(`📍 Finding Y'all events: ${stats.findingYallEvents}`);
  console.log(`🎟️  Eventbrite events: ${stats.eventbriteEvents}`);
  console.log(`🔄 Partner events updated: ${stats.eventsUpdated}`);
  console.log(`❌ Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('═══════════════════════════════════════\n');

  return stats;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  maintainEvents()
    .then(stats => {
      if (stats.errors.length > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { maintainEvents };
