# Google API Shutdown Report

**Date:** October 12, 2025
**Reason:** Budget exceeded for Google Maps/Places API
**Status:** ALL GOOGLE API CALLS DISABLED

---

## Executive Summary

All Google API functionality has been **completely disabled** to prevent further charges. Venue data that was previously imported is safely stored in the Supabase database and remains available.

---

## What Was Disabled

### 1. Backend Import Scripts (MOVED TO: `scripts/DISABLED_google_api/`)

All scripts that fetch venue data from Google Places API have been moved to a disabled folder:

- **`fetch-national-venues.ts`** - Bulk venue imports for 50+ cities
- **`seed-many-venues.ts`** - Seeds 200 venues per city
- **`backfill-venue-details.ts`** - Fetches phone, website, hours, ratings
- **`fetch-venue-photos.ts`** - Downloads venue photos
- **`fetch-missing-photos.ts`** - Backfills missing photos
- **`fetch-real-photos.ts`** - Downloads photos using new Google Places API

**API Endpoints Used:**
- `maps.googleapis.com/maps/api/place/nearbysearch/json`
- `maps.googleapis.com/maps/api/place/textsearch/json`
- `maps.googleapis.com/maps/api/place/details/json`
- `maps.googleapis.com/maps/api/place/photo`
- `maps.googleapis.com/maps/api/place/findplacefromtext/json`
- `places.googleapis.com/v1/places:searchText`
- `places.googleapis.com/v1/places/{id}`

### 2. Admin API Endpoint (DISABLED)

- **`/api/admin/seed-venues`** - Admin endpoint for on-demand venue seeding
  - Location: Moved from `src/pages/api/admin/seed-venues.ts` → `scripts/DISABLED_google_api/admin-seed-venues.ts`
  - This endpoint is no longer accessible via HTTP requests

### 3. Frontend Google Maps Usage (STILL ACTIVE - NEEDS ATTENTION)

**WARNING:** The following frontend components still use Google Maps API and may incur charges:

#### Address Search Component
- **File:** `src/components/AddressSearchIsland.tsx`
- **Usage:**
  - Google Places Autocomplete (address suggestions)
  - Google Geocoding API (address → coordinates)
  - Reverse Geocoding (coordinates → address)
- **Pages Using This:**
  - `src/pages/index.astro` (Homepage search)
  - `src/pages/cities.astro`
  - `src/pages/[state]/index.astro`

#### Base Layout
- **File:** `src/layouts/Base.astro` (line 112)
- **Loads:** `https://maps.googleapis.com/maps/api/js?key=...&libraries=places`

---

## ✅ RESOLVED: Frontend Replaced with Mapbox (October 12, 2025)

### What Was Changed

The frontend address search has been **completely replaced** with Mapbox Geocoding API:

**Old Component (DISABLED):**
- `src/components/AddressSearchIsland.tsx` (moved to `scripts/DISABLED_google_api/`)
- Used Google Places Autocomplete API
- Used Google Geocoding API
- Cost: $2.83-$5.00 per 1,000 requests

**New Component (ACTIVE):**
- `src/components/MapboxAddressSearch.tsx`
- Uses Mapbox Geocoding API
- **100,000 FREE requests/month**
- $0.50 per 1,000 requests after free tier (10x cheaper than Google)

### Features Maintained

The new Mapbox component provides the same functionality:
- ✅ Address autocomplete with dropdown suggestions
- ✅ "Use my current location" button
- ✅ Reverse geocoding (coordinates → address)
- ✅ US-only filtering
- ✅ 300ms debounce for performance

### Pages Updated

All pages now use the new Mapbox component:
- ✅ `src/pages/index.astro` (homepage)
- ✅ `src/pages/cities.astro`
- ✅ `src/pages/[state]/index.astro`

### Google Maps Script Removed

- ✅ Removed from `src/layouts/Base.astro` (line 112)
- No more Google Maps JavaScript API loading on any page

---

## Data Safety Status

### Venue Data: SAFE ✅
All venue data imported before shutdown is safely stored in Supabase:
- Venue names, addresses, coordinates
- Contact info (phone, website, hours)
- Photos (stored in Supabase storage)
- Ratings and review counts

### No Data Loss
- Disabling the import scripts does NOT delete any existing venues
- All venue information remains in the database
- Photos are already uploaded to Supabase storage

---

## Alternative Approaches Going Forward

### 1. Manual Venue Entry
Use the admin portal to manually add venues:
- Quality over quantity
- Verified autism-friendly features
- Community-curated

### 2. Community Submissions
Enable users to submit venues:
- Form-based venue submission
- Admin moderation workflow
- Builds community engagement

### 3. Partner Data Imports
Import venue lists from partners:
- CSV uploads from autism organizations
- Data sharing agreements
- Pre-verified sensory-friendly venues

### 4. Open Data Sources
Use free/open alternatives:
- **OpenStreetMap** (OSM) - Completely free
- Government open data portals
- Municipal parks and rec databases

---

## Environment Variables Status

### Current Setup
- `GOOGLE_MAPS_API_KEY` - Still set in environment
- `PUBLIC_GOOGLE_MAPS_API_KEY` - Public-facing key (STILL USED BY FRONTEND)

### Recommended Action
**DO NOT DELETE** the environment variables yet, because:
1. Frontend still uses `PUBLIC_GOOGLE_MAPS_API_KEY`
2. May want to re-enable if budget restored

**To fully stop charges:**
1. Remove Google Maps script from `src/layouts/Base.astro`
2. Delete or comment out `AddressSearchIsland` usage
3. THEN delete environment variables from Vercel

---

## How to Re-Enable (If Budget Allows)

### Step 1: Verify Budget
- Check Google Cloud Console billing
- Set up billing alerts
- Configure daily spending limits

### Step 2: Restore Scripts
```bash
mv scripts/DISABLED_google_api/*.ts scripts/
```

### Step 3: Restore API Endpoint
```bash
mv scripts/DISABLED_google_api/admin-seed-venues.ts src/pages/api/admin/seed-venues.ts
```

### Step 4: Test Carefully
```bash
# Always test with limits first
npx tsx scripts/fetch-national-venues.ts --limit=1
```

---

## Cost Estimation (Before Shutdown)

### Backend Scripts Cost
If scripts were running daily:
- Place Search: ~$32/1,000 requests
- Place Details: ~$17/1,000 requests
- Photos: ~$7/1,000 requests

### Frontend Cost
Active users triggering geocoding:
- Varies by traffic volume
- Could be $50-500+/month depending on usage

---

## Immediate Next Steps

1. **URGENT:** Decide on frontend address search:
   - Remove entirely?
   - Replace with Mapbox?
   - Disable temporarily?

2. **Monitor:** Check Google Cloud Console for any remaining charges

3. **Update Documentation:** Update CLAUDE.md to reflect changes

4. **Alternative Implementation:** Set up OpenStreetMap or Mapbox for future venue imports

---

## Questions?

For questions about this shutdown:
- Backend scripts: See `scripts/DISABLED_google_api/README.md`
- Frontend components: See `src/components/AddressSearchIsland.tsx`
- Database status: All venue data intact in Supabase

**Status:** Backend imports STOPPED ✅
**Frontend:** REPLACED with Mapbox ✅
**All Google API calls:** DISABLED ✅
