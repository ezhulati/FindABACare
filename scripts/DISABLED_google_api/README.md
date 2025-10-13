# DISABLED Google API Scripts

**IMPORTANT: These scripts have been DISABLED to prevent further Google API charges.**

Date Disabled: 2025-10-12
Reason: Budget exceeded for Google Maps API

## Disabled Scripts

All scripts in this directory make calls to Google Places/Maps APIs and have been moved here to prevent accidental execution.

### Backend Scripts (DISABLED)
- `fetch-national-venues.ts` - Fetches venues from Google Places API for multiple cities
- `seed-many-venues.ts` - Seeds 200 venues per city from Google Places API
- `backfill-venue-details.ts` - Backfills contact info (phone, website, hours) from Google Places
- `fetch-venue-photos.ts` - Downloads venue photos from Google Places API
- `fetch-missing-photos.ts` - Downloads photos for venues missing images
- `fetch-real-photos.ts` - Fetches real photos using Google Places API (New)

### API Endpoints (DISABLED)
- `admin-seed-venues.ts` - Admin endpoint for on-demand venue seeding (was at `/api/admin/seed-venues`)

## What These Scripts Did

These scripts made the following types of Google API calls:
1. **Place Search** - `places/nearbysearch` and `places/textsearch` endpoints
2. **Place Details** - `place/details` endpoint for phone, website, hours, ratings
3. **Place Photos** - `place/photo` endpoint for downloading venue images
4. **Find Place** - `place/findplacefromtext` endpoint for location matching

## Current Database Status

All venue data that was successfully imported before disabling is safely stored in the Supabase database. No data has been lost.

## Alternative Approaches

Going forward, use these alternatives:
1. **Manual Venue Entry** - Use admin portal to manually add venues
2. **Community Submissions** - Allow users to submit venues
3. **Partner Data** - Import venue lists from partners (CSV uploads)
4. **Free/Open Data Sources** - OpenStreetMap, government open data portals

## Re-enabling (Only if budget allows)

To re-enable these scripts:
1. Ensure Google Maps API budget is available
2. Set `GOOGLE_MAPS_API_KEY` environment variable
3. Move scripts back to `/scripts` directory
4. Review and test with `--limit=1` flag first

## DO NOT RUN

Do not run any scripts in this directory unless you have confirmed:
- [ ] Google API budget is restored
- [ ] API key is valid and active
- [ ] Rate limits are configured
- [ ] Billing alerts are set up
