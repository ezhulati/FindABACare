# Event System Documentation

## Overview

autism.place features a comprehensive event sourcing system that combines automated scraping with community submissions to aggregate autism-friendly events nationwide.

## Event Types

The system supports three types of events:

1. **Partner Events** (`event_type: 'partner'`)
   - Events scraped from external sources
   - Link directly to partner websites for RSVP
   - Examples: Meetup groups, Eventbrite, Autism Speaks, Finding Y'all

2. **Official Events** (`event_type: 'official'`)
   - Events organized directly by autism.place
   - RSVP handled internally

3. **Community Events** (`event_type: 'community'`)
   - User-submitted events
   - Require moderation/approval before publishing

## Automated Event Scrapers

### 1. Finding Y'all Scraper
**File:** `scripts/import-findingyall-events.ts`

Imports events from Finding Y'all, a curated autism events platform.

```bash
env SUPABASE_SERVICE_ROLE_KEY="..." \
    PUBLIC_SUPABASE_URL="..." \
    npx tsx scripts/import-findingyall-events.ts
```

**Features:**
- Direct API integration
- High-quality curated events
- Automatic deduplication via `external_id`

### 2. Eventbrite Scraper
**File:** `scripts/scrape-eventbrite.ts`

Scrapes autism-related events from Eventbrite across 8 major cities.

```bash
env SUPABASE_SERVICE_ROLE_KEY="..." \
    PUBLIC_SUPABASE_URL="..." \
    npx tsx scripts/scrape-eventbrite.ts
```

**Features:**
- Searches: Dallas, Houston, Austin, Phoenix, LA, San Diego, NYC, Chicago
- AI-powered event categorization
- Filters for autism relevance (medium/high confidence)
- Creates placeholder venues if needed

### 3. Meetup.com Scraper
**File:** `scripts/scrape-meetup.ts`

Scrapes autism support groups and events from Meetup.com.

```bash
env SUPABASE_SERVICE_ROLE_KEY="..." \
    PUBLIC_SUPABASE_URL="..." \
    npx tsx scripts/scrape-meetup.ts
```

**Features:**
- Search terms: "autism support", "autism parents", "special needs", "neurodivergent", "ASD support"
- Covers 8 major US cities
- Extracts group names for attribution
- 3-second delay between requests (respectful scraping)

### 4. Autism Speaks Scraper
**File:** `scripts/scrape-autism-speaks.ts`

Scrapes events from Autism Speaks, including walks and fundraisers.

```bash
env SUPABASE_SERVICE_ROLE_KEY="..." \
    PUBLIC_SUPABASE_URL="..." \
    npx tsx scripts/scrape-autism-speaks.ts
```

**Features:**
- Scrapes national events page
- Extracts city/state from location strings
- Filters out past events automatically
- Multiple date format parsing

## Community Submission System

### Submission Form
**URL:** `/submit-event`
**File:** `src/pages/submit-event.astro`

User-friendly form for community members to submit events.

**Required Fields:**
- Event title
- Description
- Date and time (start/end)
- City selection (dropdown)
- Venue name and address
- Submitter name and email

**Validation:**
- Email format validation
- Future date requirement
- All required fields checked

### API Endpoint
**URL:** `/api/submit-event`
**File:** `src/pages/api/submit-event.ts`
**Method:** POST

Handles event submissions with the following workflow:

1. Validates all input fields
2. Finds or creates venue in database
3. Creates event with `approval_status: 'pending'`
4. Stores submitter info in `admin_notes`
5. Returns success/error response

**Event Status:**
- `status: 'draft'` - Not yet published
- `approval_status: 'pending'` - Awaiting moderation

## Database Schema

### Events Table

Key columns for the event system:

```sql
-- Event identification
id UUID PRIMARY KEY
external_id TEXT UNIQUE  -- For deduplication (e.g., "meetup-12345")

-- Event details
title TEXT
description TEXT
date DATE
start_time TIME
end_time TIME

-- Location
venue_id UUID (FK to venues)
city_id UUID (FK to cities)

-- Event classification
event_type TEXT  -- 'partner', 'official', 'community'
source_url TEXT  -- Link to external event page
source_name TEXT -- e.g., "Meetup - Dallas Autism Parents"

-- Publishing status
status TEXT  -- 'draft', 'published'
approval_status TEXT  -- 'pending', 'approved', 'rejected', 'flagged'

-- Moderation
admin_notes TEXT  -- Submitter info, notes
approved_by UUID
approved_at TIMESTAMP

-- Scraping metadata
scraped_at TIMESTAMP
last_synced_at TIMESTAMP

-- Featured placement
is_featured BOOLEAN
```

## Events Page UI

### Main Events Page
**URL:** `/events`
**File:** `src/pages/events.astro`

**Features:**
- Featured events carousel (next 2 weeks)
- State filtering tabs
- Event type badges (Partner, Official, Community)
- Conditional RSVP buttons:
  - Partner events: Blue "RSVP on {Partner}" → External link
  - Official/Community: Black "View Details & RSVP" → Internal page

### CTA Section

Two prominent buttons:
1. **Submit an Event** → `/submit-event`
2. **Contact us** → `/contact`

## Event Display Logic

### Partner Events
```astro
{event.event_type === 'partner' && event.source_url ? (
  <a href={event.source_url} target="_blank">
    RSVP on {event.source_name}
  </a>
) : (
  <a href={`/${state}/${city}/events#${event.id}`}>
    View Details & RSVP
  </a>
)}
```

### Event Badges
- **Partner Event**: Blue badge with source name
- **Official Event**: Purple badge
- **Community Event**: Green badge

## Deduplication Strategy

All scrapers use `external_id` to prevent duplicates:

- **Meetup**: `meetup-{event_id}`
- **Eventbrite**: `eventbrite-{event_id}`
- **Autism Speaks**: `autism-speaks-{slug}`
- **Finding Y'all**: `findingyall-{event_id}`

Before inserting, scrapers check:
```typescript
const { data: existing } = await supabase
  .from('events')
  .select('id')
  .eq('external_id', externalId)
  .single();

if (existing) {
  // Update last_synced_at and skip
}
```

## Automation & Scheduling

### Recommended Cron Jobs

```bash
# Run daily at 6 AM
0 6 * * * cd /app && npx tsx scripts/scrape-meetup.ts >> logs/meetup.log 2>&1

# Run weekly on Mondays
0 6 * * 1 cd /app && npx tsx scripts/scrape-autism-speaks.ts >> logs/autism-speaks.log 2>&1

# Run daily at 7 AM
0 7 * * * cd /app && npx tsx scripts/scrape-eventbrite.ts >> logs/eventbrite.log 2>&1

# Run weekly on Sundays
0 6 * * 0 cd /app && npx tsx scripts/import-findingyall-events.ts >> logs/findingyall.log 2>&1
```

## Future Enhancements

### Still To Build

1. **Admin Moderation Dashboard**
   - View pending community submissions
   - Approve/reject with notes
   - Bulk actions
   - Email notifications to submitters

2. **Additional Scrapers**
   - The Autism Society local chapters
   - Sensory Friendly Solutions
   - Facebook Events API (requires approval)
   - Local recreation department websites

3. **Event Management**
   - Edit existing events
   - Mark events as "sold out" or "cancelled"
   - Recurring event support
   - Capacity tracking

4. **Notifications**
   - Email submitters on approval/rejection
   - Alert admins of new submissions
   - Digest emails for upcoming events in user's city

5. **Analytics**
   - Track RSVP clicks by source
   - Popular event types
   - Geographic distribution
   - Scraper success rates

## Troubleshooting

### Scraper Not Finding Events

**Check:**
1. Website structure hasn't changed (CSS selectors)
2. Rate limiting / IP blocking
3. Authentication requirements
4. Site using JavaScript rendering

**Solution:** Use Playwright's debugging mode:
```bash
PWDEBUG=1 npx tsx scripts/scrape-meetup.ts
```

### Events Not Appearing on Site

**Check:**
1. `status = 'published'`
2. `approval_status = 'approved'`
3. `date` is in the future
4. Event linked to active city

**Query:**
```sql
SELECT * FROM events
WHERE status != 'published'
OR approval_status != 'approved'
LIMIT 10;
```

### Duplicate Events

**Check:**
1. `external_id` is being set correctly
2. Multiple scrapers generating same ID format
3. URL changes between scrapes

**Fix:**
```sql
-- Find duplicates
SELECT title, date, COUNT(*)
FROM events
GROUP BY title, date
HAVING COUNT(*) > 1;

-- Delete duplicates (keep oldest)
DELETE FROM events
WHERE id NOT IN (
  SELECT MIN(id) FROM events
  GROUP BY external_id
);
```

## Testing

### Manual Testing

1. **Test submission form:**
   ```
   http://localhost:4321/submit-event
   ```

2. **Test API endpoint:**
   ```bash
   curl -X POST http://localhost:4321/api/submit-event \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Event",
       "description": "Test description",
       "date": "2025-12-01",
       "start_time": "10:00",
       "end_time": "12:00",
       "city_id": "...",
       "venue_name": "Test Venue",
       "venue_address": "123 Main St",
       "submitter_name": "John Doe",
       "submitter_email": "john@example.com"
     }'
   ```

3. **Check events display:**
   ```
   http://localhost:4321/events
   ```

### Scraper Testing

Run scrapers with limited output:
```bash
# Test scraper without DB writes
npx tsx -e "
import { scrapeMeetupCity } from './scripts/scrape-meetup.ts';
const events = await scrapeMeetupCity('autism support', {
  name: 'Dallas',
  state: 'TX',
  slug: 'dallas',
  lat: 32.7767,
  lng: -96.7970
});
console.log(events);
"
```

## Support

For questions or issues with the event system:
- Check logs in `logs/` directory
- Review Supabase database directly
- Contact: hello@autism.place
