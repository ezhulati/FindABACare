# Events System Setup Guide

This guide covers the complete setup and operation of the automated events system for autism.place. The system automatically scrapes autism-related events from partner sources (Finding Y'all, Eventbrite), categorizes them, and maintains a clean event database.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Migration](#database-migration)
- [Environment Variables](#environment-variables)
- [Manual Scraper Usage](#manual-scraper-usage)
- [Automated Cron Setup](#automated-cron-setup)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

The events system consists of four main components:

1. **Event Categorizer** (`scripts/event-categorizer.ts`) - Determines if events are autism-relevant based on keywords
2. **Finding Y'all Scraper** (`scripts/scrape-findingyall-events.ts`) - Scrapes events from Finding Y'all
3. **Eventbrite Scraper** (`scripts/scrape-eventbrite.ts`) - Scrapes autism-related events from Eventbrite
4. **Maintenance Script** (`scripts/maintain-events.ts`) - Orchestrates all scrapers and cleanup tasks
5. **Cron Endpoint** (`src/pages/api/cron/sync-events.ts`) - Vercel cron job that runs maintenance daily

## Architecture

```
┌─────────────────────────────────────────┐
│         Vercel Cron Job                 │
│   (Runs daily at 2 AM UTC)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    /api/cron/sync-events                │
│    (Protected by CRON_SECRET)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    scripts/maintain-events.ts           │
│    - Run Finding Y'all scraper          │
│    - Run Eventbrite scraper             │
│    - Remove past events                 │
│    - Update sync timestamps             │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────────┐
│ Finding Y'all│  │   Eventbrite    │
│   Scraper    │  │     Scraper     │
└──────┬───────┘  └────────┬────────┘
       │                   │
       └─────────┬─────────┘
                 ▼
       ┌──────────────────┐
       │ Event Categorizer│
       │  (Filter & Tag)  │
       └─────────┬────────┘
                 ▼
       ┌──────────────────┐
       │  Supabase DB     │
       │  (events table)  │
       └──────────────────┘
```

## Database Migration

### Step 1: Run the Migration

The migration adds support for multiple event types (partner, official, community) and tracking fields.

1. Open Supabase SQL Editor at https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. Copy and paste the contents of `/Users/ez/Desktop/AI Library/Apps/FindABACare/supabase/migrations/002_add_event_types.sql`

3. Click "Run" to execute the migration

4. Verify the migration succeeded:

```sql
-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('event_type', 'external_id', 'source_name', 'source_url', 'approval_status', 'scraped_at', 'last_synced_at');
```

You should see 7 rows returned.

### What the Migration Does

- Adds `event_type` column: 'partner' (scraped), 'official' (autism.place), 'community' (user-submitted)
- Adds `external_id` column: Unique identifier to prevent duplicate scraping
- Adds `source_url` and `source_name`: Track where partner events came from
- Adds `approval_status`: For moderating community events
- Adds `scraped_at` and `last_synced_at`: Track when events were scraped/updated
- Adds `is_featured`: Flag for highlighting special events
- Updates RLS policies for different event types
- Creates indexes for performance

## Environment Variables

The following environment variables are required (should already be in your `.env`):

```bash
# Supabase
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Cron Authentication
CRON_SECRET="your-secure-random-string"
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `CRON_SECRET` = A secure random string (same as in `.env`)

## Manual Scraper Usage

### Prerequisites

Install dependencies:

```bash
npm install
```

The scrapers use Playwright, which is already in `package.json` dependencies.

### Running Individual Scrapers

#### Finding Y'all Scraper

Scrapes events from the Finding Y'all website (Dallas-focused autism events):

```bash
npm run tsx scripts/scrape-findingyall-events.ts
```

Optional arguments:
```bash
# Specify a different city
npm run tsx scripts/scrape-findingyall-events.ts -- --city=houston --state=TX
```

#### Eventbrite Scraper

Scrapes autism-related events from Eventbrite across 8 major cities:

```bash
npm run tsx scripts/scrape-eventbrite.ts
```

Cities scraped:
- Dallas, TX
- Houston, TX
- Austin, TX
- Phoenix, AZ
- Los Angeles, CA
- San Diego, CA
- New York, NY
- Chicago, IL

#### Maintenance Script (Recommended)

Run all scrapers and cleanup in one command:

```bash
npm run tsx scripts/maintain-events.ts
```

This will:
1. Remove past events (date < today)
2. Scrape Finding Y'all events
3. Scrape Eventbrite events
4. Update last_synced_at for all partner events
5. Provide a detailed summary

### Understanding the Output

```
🔧 Starting Event Maintenance

📅 Date: 2025-10-12 14:30:00

🗑️  Removing past events...
   Found 5 past events
   ✅ Removed 5 past events

📍 Running Finding Y'all scraper...
   ✅ Imported: Boo Bash
   ✅ Imported: Open Gym Social
   📊 Finding Y'all: 2 imported, 0 skipped

📍 Running Eventbrite scraper...

🔍 Scraping Eventbrite for Dallas, TX...
   Found 15 potential events
   ✅ Autism Social Skills Workshop (confidence: high)
   ⏭️  Skipped: Generic Event (not autism-relevant)
   📊 Eventbrite: Found 8 events

═══════════════════════════════════════
📊 MAINTENANCE SUMMARY
═══════════════════════════════════════
🗑️  Past events removed: 5
📍 Finding Y'all events: 2
🎟️  Eventbrite events: 8
🔄 Partner events updated: 25
❌ Errors: 0
═══════════════════════════════════════
```

## Automated Cron Setup

### Vercel Cron Configuration

The system uses Vercel Cron Jobs to run maintenance automatically.

#### 1. Update vercel.json

Add the sync-events cron job to `/Users/ez/Desktop/AI Library/Apps/FindABACare/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-go-now",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/send-rsvp-reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-review-prompts",
      "schedule": "30 * * * *"
    },
    {
      "path": "/api/cron/sync-events",
      "schedule": "0 2 * * *"
    }
  ]
}
```

The schedule `"0 2 * * *"` means:
- Run at 2:00 AM UTC every day
- This is 9 PM CST (evening in Texas)

#### 2. Deploy to Vercel

Commit and push your changes:

```bash
git add .
git commit -m "Add automated events scraping system"
git push
```

Vercel will automatically deploy and set up the cron jobs.

#### 3. Verify Cron Setup

1. Go to your Vercel project dashboard
2. Navigate to Settings > Cron Jobs
3. You should see "sync-events" listed with schedule "0 2 * * *"

### Alternative Schedules

You can adjust the schedule in `vercel.json`:

```
# Every day at 2 AM UTC
"0 2 * * *"

# Every day at 6 AM UTC
"0 6 * * *"

# Every 12 hours
"0 */12 * * *"

# Every Monday at 3 AM UTC
"0 3 * * 1"
```

Cron syntax: `minute hour day month weekday`

## Testing

### 1. Test the Event Categorizer

```bash
npm run tsx scripts/event-categorizer.ts
```

Test categorization logic:

```typescript
import { categorizeEvent } from './scripts/event-categorizer.js';

const event = {
  title: 'Autism Friendly Movie Night',
  description: 'Sensory-friendly screening with reduced volume and lighting',
  tags: ['family-friendly']
};

const result = categorizeEvent(event);
console.log(result);
// {
//   isAutismRelevant: true,
//   confidence: 'high',
//   keywords: ['autism', 'sensory-friendly', 'sensory'],
//   suggestedTags: ['Sensory-Friendly']
// }
```

### 2. Test Individual Scrapers

Test Finding Y'all scraper:

```bash
npm run tsx scripts/scrape-findingyall-events.ts
```

Test Eventbrite scraper:

```bash
npm run tsx scripts/scrape-eventbrite.ts
```

### 3. Test the Maintenance Script

Run the full maintenance workflow:

```bash
npm run tsx scripts/maintain-events.ts
```

Check the console output for any errors.

### 4. Test the Cron Endpoint Locally

Using curl:

```bash
curl -X GET http://localhost:4321/api/cron/sync-events \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:

```json
{
  "success": true,
  "message": "Event sync completed successfully",
  "stats": {
    "findingYallEvents": 2,
    "eventbriteEvents": 8,
    "pastEventsRemoved": 5,
    "eventsUpdated": 25,
    "errorCount": 0
  },
  "errors": [],
  "timestamp": "2025-10-12T14:30:00.000Z",
  "durationMs": 45232
}
```

### 5. Test Cron Endpoint in Production

Once deployed to Vercel:

```bash
curl -X GET https://autism.place/api/cron/sync-events \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 6. Verify Database Changes

After running scrapers, verify in Supabase:

```sql
-- Check partner events
SELECT
  title,
  date,
  source_name,
  external_id,
  scraped_at
FROM events
WHERE event_type = 'partner'
ORDER BY scraped_at DESC
LIMIT 10;

-- Check event sources
SELECT
  source_name,
  COUNT(*) as event_count
FROM events
WHERE event_type = 'partner'
GROUP BY source_name;

-- Check for duplicates (should be 0)
SELECT
  external_id,
  COUNT(*) as count
FROM events
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1;
```

## Monitoring

### Vercel Logs

View cron job execution logs:

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" in the left sidebar
4. Filter by "/api/cron/sync-events"

### Database Queries

Monitor event scraping health:

```sql
-- Events scraped in the last 7 days
SELECT
  DATE(scraped_at) as date,
  source_name,
  COUNT(*) as events_scraped
FROM events
WHERE scraped_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(scraped_at), source_name
ORDER BY date DESC;

-- Events by city
SELECT
  c.name as city,
  c.state,
  COUNT(*) as event_count
FROM events e
JOIN cities c ON e.city_id = c.id
WHERE e.event_type = 'partner'
  AND e.date >= CURRENT_DATE
GROUP BY c.name, c.state
ORDER BY event_count DESC;

-- Last sync time by source
SELECT
  source_name,
  MAX(last_synced_at) as last_sync,
  COUNT(*) as active_events
FROM events
WHERE event_type = 'partner'
  AND date >= CURRENT_DATE
GROUP BY source_name;
```

### Set Up Alerts (Optional)

You can set up alerts for scraping failures:

1. Use Vercel's webhook notifications
2. Monitor the cron endpoint response
3. Set up a service like UptimeRobot to ping the endpoint

## Troubleshooting

### Common Issues

#### 1. Scraper Times Out

**Symptom:** Playwright browser times out or events don't load

**Solutions:**
- Increase timeout in scraper: `timeout: 60000`
- Check if website structure changed
- Verify network connectivity

#### 2. No Events Found

**Symptom:** Scraper runs but finds 0 events

**Solutions:**
- Check if source website is up
- Verify CSS selectors are still valid
- Check event categorizer keywords

#### 3. Duplicate Events

**Symptom:** Same events appear multiple times

**Solutions:**
- Verify `external_id` is unique
- Check database constraints
- Review scraper logic for ID generation

#### 4. Cron Job Fails

**Symptom:** Cron job returns 500 error

**Solutions:**
- Check Vercel logs for error details
- Verify environment variables are set
- Test maintenance script locally
- Check Supabase connection

#### 5. Events Not Categorized Properly

**Symptom:** Non-autism events are imported or autism events are skipped

**Solutions:**
- Update keyword lists in `scripts/event-categorizer.ts`
- Adjust confidence thresholds
- Review and test categorization logic

### Debug Mode

Add verbose logging:

```typescript
// In any scraper
console.log('DEBUG:', JSON.stringify(data, null, 2));
```

Run with TSX for detailed errors:

```bash
npm run tsx scripts/maintain-events.ts 2>&1 | tee debug.log
```

### Manual Database Fixes

Remove a specific event:

```sql
DELETE FROM events WHERE external_id = 'eventbrite-12345';
```

Reset last_synced_at:

```sql
UPDATE events
SET last_synced_at = NULL
WHERE event_type = 'partner';
```

Remove all partner events (use with caution):

```sql
DELETE FROM events WHERE event_type = 'partner';
```

## Maintenance Tasks

### Weekly

- Review Vercel logs for errors
- Check event counts in database
- Verify events are being scraped

### Monthly

- Update keyword lists if needed
- Review event categorization accuracy
- Check for source website changes
- Clean up placeholder venues

### As Needed

- Add new event sources
- Update city list
- Adjust categorization confidence thresholds
- Optimize scraping performance

## Adding New Event Sources

To add a new event source:

1. Create a new scraper: `scripts/scrape-[source].ts`
2. Import and call it in `scripts/maintain-events.ts`
3. Use the event categorizer to filter events
4. Set unique `external_id` format: `[source]-[id]`
5. Set `source_name` appropriately
6. Test thoroughly before adding to cron

Example structure:

```typescript
import { categorizeEvent } from './event-categorizer.js';

async function scrapeNewSource() {
  // Scraping logic
  const events = []; // scraped events

  // Categorize each event
  for (const event of events) {
    const categorization = categorizeEvent(event);
    if (categorization.isAutismRelevant) {
      // Add to import list
    }
  }

  return events;
}
```

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review Vercel logs
3. Check Supabase database state
4. Review scraper console output

## Summary

The automated events system provides:

- Automatic daily scraping of autism-relevant events
- Intelligent categorization and filtering
- Duplicate prevention
- Automatic cleanup of past events
- Comprehensive logging and monitoring
- Production-ready error handling

The system runs automatically via Vercel cron jobs and requires minimal maintenance once set up.
