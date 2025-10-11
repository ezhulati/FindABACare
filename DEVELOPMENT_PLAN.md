# FindABACare.com - Complete Development Plan

## Executive Summary

This development plan outlines the end-to-end implementation of **FindABACare.com**, an autism-friendly community discovery platform connecting families with sensory-friendly venues, micro-events, and verified community spaces in Dallas and Houston.

### Mission
Create a trusted community and care discovery platform that makes low-stress social time predictable and accessible for families with autistic children.

### Tech Stack
- **Frontend**: Astro 4.x + TypeScript + Tailwind CSS
- **Backend**: Astro API routes (Node.js) + Vercel serverless
- **Database**: Supabase (Postgres + Auth + Storage)
- **Maps**: Mapbox GL JS
- **Communications**: Twilio (SMS) + Resend (Email)
- **Analytics**: PostHog
- **Caching**: Upstash Redis

---

## MVP Success Metrics (First 90 Days)

1. **Weekly Active Families**: ≥500 per metro
2. **Avg. Successful Outings**: ≥1.5/week per family
3. **RSVP→Attendance Rate**: ≥60%
4. **Parent Satisfaction**: ≥80% "Would return"
5. **Venue Verification Freshness**: ≤30 days

---

## Phase 1: Foundation & Infrastructure (Week 1)

### Project Initialization
- [x] Initialize Git repository
- [ ] Create Astro project with TypeScript
- [ ] Configure Tailwind CSS + PostCSS
- [ ] Set up environment variables (.env.example)
- [ ] Create project file structure

### Supabase Setup
- [ ] Create Supabase project
- [ ] Run database schema migrations
  - Cities table
  - Profiles table (parent/venue/admin roles)
  - Venues table (with sensory attributes)
  - Events table (micro-groups)
  - RSVPs table
  - Reviews table
  - Verifications table (admin queue)
  - gonow_cache table (meter caching)
- [ ] Configure Supabase Auth (Email OTP)
- [ ] Set up Storage buckets for venue photos

### Configuration Files
```
├── astro.config.mjs
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── .env.example
├── .gitignore
└── vercel.json
```

---

## Phase 2: Core Library & Utilities (Week 1-2)

### Database Helpers
**File**: `/src/lib/db.ts`
- Supabase client initialization
- Connection pooling
- Query helpers

**File**: `/src/lib/supabaseServer.ts`
- Server-side Supabase SSR client
- Cookie-based session handling
- Role-based access helpers

### Business Logic
**File**: `/src/lib/goNow.ts`
- "Quiet/Moderate/Busy" heuristic by venue type
- Time-based occupancy prediction
- Forecast next 3 hours

**File**: `/src/lib/validation.ts`
- Zod schemas for API validation
- RSVP creation schema
- Review submission schema
- Venue import schema

### Communication Services
**File**: `/src/lib/email.ts`
- Resend API integration
- Email templates (RSVP confirmation, reminders, review prompts)

**File**: `/src/lib/sms.ts`
- Twilio integration
- SMS templates (T-24h, T-2h reminders)

### Security & Performance
**File**: `/src/lib/rateLimit.ts`
- Upstash Redis rate limiting
- IP-based throttling
- Endpoint-specific limits

**File**: `/src/lib/authedFetch.ts`
- Client-side authenticated fetch wrapper
- JWT token management
- Session refresh handling

---

## Phase 3: UI Components (Week 2)

### Layout Components
**File**: `/src/layouts/Base.astro`
- Global header with navigation
- City switcher (Dallas/Houston)
- Footer with links
- Meta tags and SEO defaults

### Venue Components
**File**: `/src/components/VenueCard.astro`
- Venue name, address, type
- "Go Now" meter (Quiet/Moderate/Busy)
- Amenities badges (quiet room, no hand dryers, visual supports)
- Last verified timestamp
- Link to detail page

**File**: `/src/components/VenueFiltersIsland.tsx` (React)
- Filter checkboxes (quiet room, sensory hours, hand dryers)
- Live filter updates
- Query param sync

**File**: `/src/components/MapIsland.tsx` (React)
- Mapbox GL JS integration
- Venue markers
- Click to view venue
- Cluster support for dense areas

### Interactive Islands
**File**: `/src/components/RSVPButtonIsland.tsx` (React)
- Auth gate (prompt login if needed)
- RSVP submission
- Capacity progress bar
- Loading and success states

**File**: `/src/components/AuthIsland.tsx` (React)
- Email input for OTP
- "Check your email" confirmation
- Session management
- Sign out button

---

## Phase 4: Core Pages (Week 2-3)

### Public Pages
**File**: `/src/pages/index.astro`
- Hero: "Find places that work for your child"
- City cards (Dallas, Houston)
- Value proposition
- CTA to browse venues

**File**: `/src/pages/[city]/index.astro` (SSR)
- City header with filters
- Mapbox map with venue pins
- Grid of VenueCards
- Filter by amenities, sensory hours
- Sort by distance, last verified

**File**: `/src/pages/venue/[slug].astro` (SSR)
- Venue header (name, address, type)
- Photo gallery (4+ images)
- "What to Expect" narrative
- Amenities list
- Triggers warnings
- Staff contact info
- Link to First Visit Kit
- Upcoming events at venue
- Community reviews

**File**: `/src/pages/kit/[venueSlug].astro` (SSG/SSR)
- Printable First Visit Kit
- Step-by-step visual walkthrough
- Parking → Entrance → Seating → Bathrooms
- Likely triggers
- Quiet spots
- PDF download option

**File**: `/src/pages/events/[city].astro` (SSR)
- Upcoming micro-events list
- Event cards with RSVP count/capacity bar
- Auth island for sign-in
- RSVP button per event
- iCal subscription link

**File**: `/src/pages/[city]/calm-windows.astro` (SSG)
- Weekly calm window schedule
- Heuristic quiet times per venue type
- 7-day forecast
- Subscribe to iCal

---

## Phase 5: API Routes (Week 3)

### Public Endpoints
**File**: `/src/pages/api/health.ts`
- Simple health check
- Returns `{ ok: true }`

**File**: `/src/pages/api/cities.ts` (GET)
- List all active cities
- Returns: `[{ id, name, state, slug }]`

**File**: `/src/pages/api/venues.ts` (GET)
- Query params: `city`, filters (quiet_room, hand_dryer, sensory_hours)
- Joins with gonow_cache for meter
- Returns: venues with cached "Go Now" meter

**File**: `/src/pages/api/events.ts` (GET)
- Query params: `city`, `date`
- Joins with venues and RSVP counts
- Returns: events with `rsvps_count`

**File**: `/src/pages/api/[city]/calendar.ics.ts` (GET)
- Generate iCal feed
- All upcoming events for city
- Includes DTSTART, DTEND, SUMMARY

### Authenticated Endpoints
**File**: `/src/pages/api/rsvps.ts` (POST)
- Requires: Supabase Auth JWT
- Body: `{ event_id }`
- Checks capacity
- Creates RSVP row
- Sends confirmation email + SMS

**File**: `/src/pages/api/reviews.ts` (POST)
- Requires: Supabase Auth JWT
- Body: `{ venue_id, predictability, staff_helpfulness, clarity_of_signage, would_return, tips }`
- Validates with Zod
- Stores review
- Flags `verified_visit` if tied to RSVP

**File**: `/src/pages/api/report.ts` (POST)
- Requires: Auth
- Rate limited (10 req/min)
- Body: `{ type, venue_id?, event_id?, description }`
- Creates moderation task

---

## Phase 6: Admin Portal (Week 4)

### Admin Pages
**File**: `/src/pages/admin/index.astro`
- Protected by role-based middleware
- Verification queue (open tasks)
- Venue approval queue
- Event approval queue
- Quick actions (Confirm/Reject)

**File**: `/src/pages/admin/venues.astro`
- Bulk venue management
- Search and filter
- Edit venue details
- Upload photos

### Admin API
**File**: `/src/pages/api/admin/verify.ts` (POST)
- Query params: `id`, `action` (confirm/reject)
- Updates venue `last_verified`
- Marks verification task complete

**File**: `/src/pages/api/admin/import-venues.ts` (POST)
- Accepts CSV upload
- Schema: `name,address,lat,lng,type,city_id,quiet_room,hand_dryer,visual_supports`
- Validates rows
- Bulk insert to venues table
- Returns `{ ok, count }`

### Middleware
**File**: `/src/middleware.ts`
- SSR role-based authentication
- Check `/admin/*` paths
- Verify user.role === 'admin'
- Redirect unauthorized users

---

## Phase 7: Authentication & Security (Week 4-5)

### Supabase Auth Integration
- Email OTP flow
- Session management with cookies
- Profile creation on first login
- Auth state in React islands

### Row-Level Security (RLS)
```sql
-- Profiles: read all, update own
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = auth_user);

-- RSVPs: read all, insert own
create policy "rsvps_read" on rsvps for select using (true);
create policy "rsvps_insert_own" on rsvps for insert with check (auth.uid() = (select auth_user from profiles where id = profile_id));

-- Reviews: read all, insert own
create policy "reviews_read" on reviews for select using (true);
create policy "reviews_insert_own" on reviews for insert with check (auth.uid() = (select auth_user from profiles where id = profile_id));
```

### Rate Limiting
- `/api/report`: 10 req/min per IP
- `/api/rsvps`: 30 req/min per user
- `/api/reviews`: 20 req/min per user
- `/api/admin/*`: 100 req/min per admin

### Security Headers
```json
{
  "headers": [
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "geolocation=(self)" }
  ]
}
```

---

## Phase 8: Automation & Cron (Week 5)

### Go Now Meter Cache Refresh
**File**: `/src/pages/api/cron/refresh-go-now.ts`
- Recalculates meter for all venues
- Upserts to `gonow_cache` table
- Protected by `x-cron-token` header
- Runs every 15 minutes

### RSVP Reminders
**File**: `/src/pages/api/cron/send-rsvp-reminders.ts`
- Finds events starting in 24h and 2h
- Sends SMS + email to RSVPed users
- Includes event details and .ics attachment

### Review Prompts
**File**: `/src/pages/api/cron/send-review-prompts.ts`
- Finds events that ended 4h ago
- Sends review link to attendees
- Tracks `review_prompted_at` to avoid duplicates

### Vercel Cron Config
**File**: `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/refresh-go-now", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/send-rsvp-reminders", "schedule": "0 * * * *" },
    { "path": "/api/cron/send-review-prompts", "schedule": "30 * * * *" }
  ]
}
```

---

## Phase 9: Data Seeding (Week 5-6)

### Cities Seed
**File**: `/supabase/seed/cities.sql`
```sql
insert into cities (name, state, slug) values
  ('Dallas','TX','dallas'),
  ('Houston','TX','houston')
on conflict (slug) do nothing;
```

### Venue Fetcher Script
**File**: `/scripts/fetch_venues.ts`
- Uses Google Places API
- Searches museums, parks, libraries, playgrounds
- Radius: 15km from city center
- De-dupes by place_id
- Outputs CSV compatible with importer
- Usage: `pnpm tsx scripts/fetch_venues.ts "Dallas, TX" {{CITY_UUID}}`

### Sample Events
**File**: `/supabase/seed/events.sql`
```sql
insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
select v.id, 'LEGO Micro-Group', 'Ages 5-8, structured build', current_date + 3, '10:00','10:30', 8, true
from venues v join cities c on v.city_id=c.id where c.slug='dallas' limit 1;
```

### One-Click Seed
**File**: `/scripts/seed_one_click.ts`
- Runs city seed SQL
- Fetches venues via Google Places
- Imports CSVs
- Creates 4 starter events (2 per city)
- Outputs verification instructions

---

## Phase 10: SEO & Content (Week 6)

### Structured Data
- JSON-LD `Place` schema on venue pages
- JSON-LD `Event` schema on event pages
- `AggregateRating` when reviews exist
- Breadcrumb navigation

### Meta Tags
- Title: "{VenueName} - Sensory-Friendly in {City} | FindABACare"
- Description: 150 chars with key amenities
- Open Graph images (venue photos)
- Twitter Cards

### City Guides
**File**: `/src/pages/[city]/guide.astro`
- SEO-optimized content: "Sensory-Friendly Guide to {City}"
- Internal links to venues
- Tips for families
- Community resources

### Sitemap
**File**: `/src/pages/sitemap.xml.ts`
- All cities, venues, events, guides
- Weekly update frequency
- Priority by page type

---

## Phase 11: Analytics & Monitoring (Week 6-7)

### PostHog Integration
- Page view tracking
- Custom events:
  - `venue_viewed`
  - `rsvp_created`
  - `review_submitted`
  - `filter_applied`
  - `kit_downloaded`
- User properties (city, role)
- Funnel analysis (browse → RSVP → attend)

### KPI Dashboard
- Weekly active families
- Avg outings per family
- RSVP→attendance conversion
- Venue verification lag
- Review sentiment (would_return %)

### Error Monitoring
- Sentry or Logtail integration
- Error budgets (99.9% uptime)
- Alert on API latency > 500ms P95
- Dead letter queue for failed emails/SMS

---

## Phase 12: Testing & QA (Week 7)

### Functional Tests
- [ ] Email OTP login flow
- [ ] RSVP creation with capacity enforcement
- [ ] Review submission with verified_visit flag
- [ ] Admin verification workflow
- [ ] CSV import validation
- [ ] Rate limiting enforcement

### Accessibility Audit
- [ ] Keyboard navigation (tab order, focus states)
- [ ] Screen reader compatibility (ARIA labels, alt text)
- [ ] Color contrast ≥ WCAG AA (4.5:1)
- [ ] Form validation errors announced
- [ ] Skip navigation links

### Mobile Testing
- [ ] iPhone Safari (iOS 15+)
- [ ] Android Chrome
- [ ] Touch targets ≥ 44x44px
- [ ] Viewport scaling
- [ ] Map interactions

### Performance
- [ ] Lighthouse score ≥ 90 on mobile
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] P95 API latency < 300ms

---

## Phase 13: Performance Optimization (Week 7)

### Image Optimization
- Next-gen formats (WebP, AVIF)
- Lazy loading below fold
- Responsive srcset
- CDN delivery (Vercel Edge)

### Caching Strategy
- Static pages: ISR (revalidate every 1h)
- API routes: 15min cache for venues/events
- gonow_cache: 15min refresh
- CDN: 1h cache for images

### Database Optimization
```sql
-- Indexes
create index venues_city_id_idx on venues(city_id);
create index events_venue_id_date_idx on events(venue_id, date);
create index rsvps_event_id_idx on rsvps(event_id);
create index reviews_venue_id_idx on reviews(venue_id);

-- Materialized view for popular venues
create materialized view popular_venues as
select v.*, count(rv.id) as review_count, avg((rv.predictability + rv.staff_helpfulness + rv.clarity_of_signage)/3.0) as avg_rating
from venues v left join reviews rv on v.id = rv.venue_id
group by v.id;
```

---

## Phase 14: Deployment (Week 8)

### Vercel Setup
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Configure build settings (Framework: Astro)
- [ ] Enable cron jobs
- [ ] Set up staging environment (branch: `develop`)

### Domain & SSL
- [ ] Purchase domain: findabacare.com
- [ ] Configure DNS (Vercel nameservers)
- [ ] Enable auto HTTPS
- [ ] Force HTTPS redirect

### Docker (Optional Dev)
**File**: `Dockerfile`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
EXPOSE 4321
CMD ["pnpm","dev","--host","0.0.0.0"]
```

**File**: `docker-compose.yml`
```yaml
services:
  web:
    build: .
    ports: ["4321:4321"]
    env_file: .env
    volumes:
      - .:/app
      - /app/node_modules
```

---

## Phase 15: Launch (Week 8)

### Pre-Launch Checklist
- [ ] 150+ venues per city verified (< 30 days)
- [ ] 2+ weekly events per city scheduled
- [ ] First Visit Kits for top 50 venues
- [ ] "Calm Windows" posts published
- [ ] KPI dashboard live
- [ ] Error monitoring active
- [ ] Legal: Privacy Policy, Terms of Service
- [ ] Support email: hello@findabacare.com

### Soft Launch (Dallas)
- [ ] Invite 50 beta families
- [ ] Monitor metrics daily
- [ ] Fix critical bugs within 24h
- [ ] Weekly retrospective

### Full Launch (Dallas + Houston)
- [ ] Press release to local autism advocacy orgs
- [ ] Social media campaign (#FindABACare)
- [ ] Partner with 5 venues for sensory hours
- [ ] Host 4 micro-events (2 per city)

---

## Success Metrics (90-Day Review)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Weekly Active Families (Dallas) | 500 | TBD | - |
| Weekly Active Families (Houston) | 500 | TBD | - |
| Avg Outings/Family/Week | 1.5 | TBD | - |
| RSVP→Attendance Rate | 60% | TBD | - |
| Would Return Rate | 80% | TBD | - |
| Venue Verification Freshness | <30d | TBD | - |

---

## Risk Mitigation

### Risk: Data Drift (venue info becomes stale)
**Mitigation**:
- 30-day verification SLA
- "Last verified" badges
- Fast report-a-mismatch flow
- Weekly admin review queue

### Risk: Low Event Attendance
**Mitigation**:
- Partner with venues for anchor events
- T-24h and T-2h SMS reminders
- Small capacity (8-12) for quality control
- Host training and checklists

### Risk: Safety Incidents
**Mitigation**:
- Clear incident reporting
- 4h moderation SLA
- Venue removal policy
- Parent privacy (no child names/photos)

---

## Next Steps (Post-MVP)

1. **Provider Marketplace**: ABA therapists, OTs, social skills groups
2. **Matching Algorithm**: Suggest venues based on child profile
3. **Community Forum**: Moderated parent discussion boards
4. **Mobile App**: Native iOS/Android for push notifications
5. **Expansion**: Austin, San Antonio, Phoenix, Seattle

---

## Team & Resources

### Recommended Team
- **Product Manager**: Roadmap, user stories, KPIs
- **Full-Stack Engineer**: Astro + Supabase implementation
- **UX/UI Designer**: Wireframes, accessibility, visual design
- **Content Writer**: City guides, emails, parent-facing copy
- **QA/Test Engineer**: Functional and accessibility testing
- **Operations Coordinator**: Venue verification, event hosting

### External Services Budget (Monthly)
- Supabase Pro: $25
- Vercel Pro: $20
- Mapbox: $0 (free tier)
- Twilio: ~$50 (1000 SMS)
- Resend: $0 (free tier)
- Upstash Redis: $0 (free tier)
- PostHog: $0 (free tier)
- **Total**: ~$95/month

---

## Conclusion

This plan provides a complete, actionable roadmap to build and launch **FindABACare.com** as a community-driven, empathy-centered platform. The phased approach balances technical rigor with user-centric design, ensuring families can find predictable, low-stress social opportunities for their autistic children.

By Week 8, the MVP will be live in Dallas and Houston with 300+ verified venues, weekly micro-events, and a foundation for long-term growth.

**Next Action**: Begin Phase 1 - Project Setup & Infrastructure
