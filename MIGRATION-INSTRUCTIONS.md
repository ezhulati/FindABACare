# Database Migration Instructions

## Step 1: Run the SQL Migration

Go to your Supabase dashboard:
https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

Copy and paste the entire contents of:
`supabase/migrations/20251011_add_national_coverage_columns.sql`

Then click "Run" to execute the migration.

## Step 2: Test the Fetch Script

After the migration completes, test the national venue fetch script with 2 cities:

```bash
cd "/Users/ez/Desktop/AI Library/Apps/FindABACare"

SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zmt5Znp1a3duam9ta3N1dmFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE0NTQxNSwiZXhwIjoyMDc1NzIxNDE1fQ.oP1P1VSRRB_TCmEooniSoOmS-ey4oVf8aXAaADqo1F8" \
PUBLIC_SUPABASE_URL="https://gvfkyfzukwnjomksuvaq.supabase.co" \
GOOGLE_MAPS_API_KEY="AIzaSyDzaHqZcpfdSKPCNkDizt7wTX2NPRlHLWc" \
npx tsx scripts/fetch-national-venues.ts --limit=2
```

Expected output:
- Creates/finds New York and Los Angeles cities
- Fetches venues for 10 venue types (museums, parks, libraries, etc.)
- Downloads photos and uploads to Supabase Storage
- Inserts venues into database

## Step 3: Run Full Fetch for All 50 Cities

If test succeeds, run for all 50 cities (remove --limit flag):

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zmt5Znp1a3duam9ta3N1dmFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE0NTQxNSwiZXhwIjoyMDc1NzIxNDE1fQ.oP1P1VSRRB_TCmEooniSoOmS-ey4oVf8aXAaADqo1F8" \
PUBLIC_SUPABASE_URL="https://gvfkyfzukwnjomksuvaq.supabase.co" \
GOOGLE_MAPS_API_KEY="AIzaSyDzaHqZcpfdSKPCNkDizt7wTX2NPRlHLWc" \
npx tsx scripts/fetch-national-venues.ts
```

**Estimated time**: 2-4 hours (with rate limiting)
**Estimated cost**: ~$441 (see cost breakdown below)

## Google Places API Cost Breakdown

### One-Time Initial Fetch
- **Nearby Search**: 500 calls × $32/1000 = **$16**
- **Place Details**: 25,000 calls × $17/1000 = **$425**
- **Place Photos**: 20,000 calls × **FREE** (up to 100k/month)
- **Total**: ~**$441**

### Monthly Maintenance
- With 30-day cache: **$14/month**
- With $200 free credit: **FREE** (covered by Google's free tier)

### Cost Optimization
1. Cache Place Details for 30 days (not weekly)
2. Only update venues that have changed
3. Prioritize popular venues for frequent updates
4. Low-traffic venues updated quarterly

**Net Monthly Cost**: $0 (within free tier)

## Migration SQL Preview

The migration adds these columns:

**To `venues` table:**
- `google_place_id` (TEXT, UNIQUE) - Google's place identifier
- `data_source` ('manual' | 'google_places' | 'user_submitted')
- `verification_status` ('unverified' | 'community_verified' | 'admin_verified')
- `review_count` (INTEGER) - Number of community reviews
- `average_rating` (DECIMAL) - Average of community ratings
- `google_rating` (DECIMAL) - Google's rating (1-5)
- `google_review_count` (INTEGER) - Google's review count
- `is_open_now` (BOOLEAN) - Current open/closed status
- `hours` (JSONB) - Operating hours
- `last_synced_at` (TIMESTAMP) - Last sync from Google Places

**To `cities` table:**
- `priority_tier` (INTEGER) - 1 (tier 1), 2 (tier 2), 3 (tier 3)
- `population` (INTEGER) - City population
- `auto_sync_enabled` (BOOLEAN) - Enable automatic syncing

## What Gets Created

After running the full fetch, you'll have:
- **~50 cities** in the `cities` table
- **~25,000 venues** in the `venues` table
- **~20,000 photos** in Supabase Storage
- All venues marked as `verification_status: 'unverified'`
- All venues have `data_source: 'google_places'`

Existing Dallas/Houston venues remain marked as `admin_verified` and `manual`.
