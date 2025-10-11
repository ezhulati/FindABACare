# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**findABA.care** is an autism-friendly community discovery platform connecting families with sensory-friendly venues, micro-events, and verified community spaces in Dallas and Houston. The platform provides detailed venue information including "Go Now" meters for real-time occupancy predictions, sensory-friendly amenities, and micro-event RSVPs.

**Tech Stack:**
- Frontend: Astro 4.x (SSR mode) + React islands + Tailwind CSS
- Backend: Astro API routes + Vercel serverless
- Database: Supabase (Postgres + Auth + Storage)
- Maps: Mapbox GL JS
- Communications: Twilio (SMS) + Resend (Email)

## Development Commands

```bash
# Start development server on port 4321
pnpm dev

# Type checking
pnpm typecheck

# Production build (includes Vercel runtime patch)
pnpm build

# Preview production build locally
pnpm preview

# Format code with Prettier
pnpm format
```

## Key Architecture Patterns

### 1. Server-Side Rendering (SSR) with Astro

The application uses Astro's server-side rendering with the Vercel adapter. Pages are rendered on-demand, not statically generated (except where explicitly configured).

**Configuration:** `astro.config.mjs` sets `output: 'server'`

### 2. Routing Structure

The app uses a **state/city-based URL structure** for better SEO and taxonomy:

```
/                              → Homepage
/[state]                       → State landing page (e.g., /texas)
/[state]/[city]                → City venue listing (e.g., /texas/dallas)
/[state]/[city]/events         → City events listing
/venue/[slug]                  → Venue detail page
```

**Legacy routes** also exist for backward compatibility:
- `/[city].astro` (e.g., `/dallas`)
- `/[city]/events.astro` (e.g., `/dallas/events`)

### 3. Supabase Client Patterns

Two distinct Supabase client patterns are used:

**Client-side (browser):** `src/lib/db.ts`
```typescript
import { supabase } from '@/lib/db';
// Used in React islands and client-side code
```

**Server-side (SSR/API routes):** `src/lib/supabaseServer.ts`
```typescript
import { getServerClient } from '@/lib/supabaseServer';
const supabase = getServerClient(request);
// Handles cookies and authentication in server context
```

**Authentication helpers:**
- `getAuthUser(request)` - Get authenticated user
- `getUserProfile(request)` - Get user profile from database
- `requireAuth(request)` - Throw 401 if not authenticated
- `requireAdmin(request)` - Throw 403 if not admin

### 4. Database Schema

Key tables (see `supabase/schema.sql`):
- **cities** - Dallas, Houston (expandable)
- **venues** - Sensory-friendly locations with amenities (JSONB), triggers (JSONB), sensory_hours (JSONB)
- **events** - Micro-events with capacity enforcement
- **profiles** - User profiles linked to auth.users with roles (parent/venue/admin)
- **rsvps** - Event registrations (unique constraint on event_id + profile_id)
- **reviews** - Venue feedback (pending/published/rejected status)
- **verifications** - Admin verification queue
- **gonow_cache** - Cached "Go Now" meter readings (Quiet/Moderate/Busy)

**JSONB Fields:**
- `venues.amenities`: `{quiet_room: boolean, hand_dryer: boolean, visual_supports: boolean, ...}`
- `venues.triggers`: `{strong_scents: boolean, loud_music: boolean, open_water: boolean}`
- `venues.sensory_hours`: Array of `{day, start_time, end_time, description}`

### 5. Go Now Meter Logic

The "Go Now" meter predicts venue occupancy based on time-of-day heuristics:

**File:** `src/lib/goNow.ts`

Returns one of: `'Quiet' | 'Moderate' | 'Busy'`

Heuristics vary by venue type (museum, park, library, restaurant). For example:
- Museums: Quiet before 11am, Moderate 11am-3pm, Busy after 3pm
- Parks: Quiet before 10am or after 6pm

The meter is cached in the `gonow_cache` table and refreshed every 15 minutes via cron job.

### 6. API Route Pattern

API routes follow RESTful conventions:

**Location:** `src/pages/api/*.ts`

**Example:** `src/pages/api/venues.ts`
- Uses `APIRoute` type from Astro
- Accepts query parameters via `url.searchParams`
- Returns JSON responses with proper status codes
- Server-side client via `getServerClient(request)`
- Uses JSONB operators for amenities filtering: `.eq('amenities->>quiet_room', 'true')`

**Query parameters:**
- `city` or `city_id` for filtering
- Amenities: `amenities.quiet_room`, `amenities.hand_dryer`, `amenities.visual_supports`
- `has_sensory_hours=true` to filter venues with sensory hours
- `limit` and `offset` for pagination

### 7. React Islands (Hydration)

Interactive components use Astro's island architecture with React:

**Files:**
- `src/components/AuthIsland.tsx` - Email OTP login
- `src/components/RSVPButtonIsland.tsx` - Event RSVP with auth gate
- `src/components/VenueFiltersIsland.tsx` - Live filtering UI
- `src/components/MapIsland.tsx` - Mapbox map with venue markers

**Usage in .astro files:**
```astro
<MapIsland client:load venues={venues} />
```

Use `client:load` for immediate hydration or `client:visible` for lazy loading.

### 8. Validation with Zod

All API inputs are validated using Zod schemas:

**File:** `src/lib/validation.ts`

Schemas:
- `RSVPCreate` - Validates event_id (UUID)
- `ReviewCreate` - Validates ratings (1-5), would_return (boolean), tips (max 1000 chars)
- `VenueImport` - CSV import validation

### 9. Type Safety

TypeScript types are generated from Supabase schema:

**File:** `src/lib/database.types.ts` (generated)

Import path alias: `@/*` maps to `./src/*` (configured in `tsconfig.json`)

**Usage:**
```typescript
import type { Database } from '@/lib/database.types';
```

### 10. Authentication Flow

**Email OTP via Supabase Auth:**
1. User enters email in `AuthIsland.tsx`
2. Supabase sends magic link/OTP
3. User clicks link or enters code
4. Session cookie is set (handled by `@supabase/ssr`)
5. Profile is auto-created via database trigger (`handle_new_user()`)

**Row Level Security (RLS):**
- Profiles: Read all, update own
- Venues: Public read (status='active'), admin-only insert
- Events: Public read (status='published'), venue/admin insert
- RSVPs: Read all, insert/update/delete own
- Reviews: Public read (status='published'), insert own

## Important Implementation Notes

### Building and Deployment

The build process includes a critical post-build script:

```bash
pnpm build
# Runs: astro build && node scripts/patch-vercel-runtime.js
```

The `patch-vercel-runtime.js` script patches Vercel function configurations to use Node.js 20 runtime. This is necessary for compatibility with the current dependencies.

### Environment Variables

Required variables (see `.env.example`):
- `SUPABASE_URL` / `PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_MAPBOX_TOKEN`
- `RESEND_API_KEY` (for email notifications)
- `RESEND_FROM_EMAIL`

Optional:
- Twilio (SMS notifications)
- Upstash Redis (rate limiting)
- PostHog (analytics)

**Important:** Variables prefixed with `PUBLIC_` are exposed to the client. Never put secrets in `PUBLIC_*` variables.

### Database Migrations

To update the schema:
1. Edit `supabase/schema.sql`
2. Run SQL in Supabase dashboard SQL Editor
3. Regenerate types if needed: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts`

### URL Structure Changes

Recent commits restructured URLs to include state for better SEO:
- Old: `/dallas` → New: `/texas/dallas`
- Old: `/houston/events` → New: `/texas/houston/events`

Both patterns currently exist. When creating new routes, prefer the state-based pattern.

### Caching Strategy

- Static assets: CDN cached by Vercel Edge
- API responses: 5-minute cache (`Cache-Control: public, max-age=300`)
- Go Now meter: 15-minute refresh cycle (cron job)
- ISR not currently enabled (SSR mode)

### Pagination Pattern

API routes return pagination metadata:
```json
{
  "venues": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

Use `limit` and `offset` query parameters for pagination.

## Common Tasks

### Adding a new API endpoint

1. Create `src/pages/api/[name].ts`
2. Export a named function matching HTTP method: `export const GET: APIRoute = async ({ request, url }) => { ... }`
3. Use `getServerClient(request)` for database access
4. Validate input with Zod schemas from `src/lib/validation.ts`
5. Return JSON with proper status codes and headers

### Adding a new page route

1. Create `src/pages/[route].astro`
2. Fetch data in frontmatter using `getServerClient(Astro.request)`
3. Use layouts from `src/layouts/`
4. For interactive elements, use React islands with `client:load` or `client:visible`

### Working with venues

Venues have complex JSONB fields. To filter by amenities:
```typescript
query = query.eq('amenities->>quiet_room', 'true');
```

To check if sensory hours exist:
```typescript
query = query.not('sensory_hours', 'is', null);
```

### Testing authentication locally

Use Supabase email OTP in development. Check the Supabase dashboard Auth logs to get the OTP code if emails aren't being delivered locally.

## Documentation References

- **DEVELOPMENT_PLAN.md** - Complete 15-phase implementation roadmap
- **SUPABASE_SETUP.md** - Supabase configuration guide
- **QUICK_START.md** - Getting started guide
- **README.md** - Project overview and quick start
- **findABA.care.com Product Vision.md** - Product requirements and user stories

## Project Status

Currently in Phase 2-3 of development (see DEVELOPMENT_PLAN.md):
- ✅ Foundation complete (database schema, utilities)
- ✅ Core components implemented
- ✅ Basic API routes functional
- 🚧 UI/UX refinement in progress
- ⏳ Admin portal pending
- ⏳ Automation/cron jobs pending
