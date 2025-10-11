# Product Vision

**FindABACare.com** starts by solving day-to-day life for families: *where can we go today that will work for our child, and who can we meet safely?*
MVP = **Autism-friendly Places + Micro-Events + RSVP** for two metros. Community traffic is the trust engine. The directory and monetization come next.

**North Star**
Reliable, low-stress social time for autistic kids each week, with predictable places, small groups, and clear preparation.

**Primary KPIs for MVP (first 90 days)**

* Weekly Active Families per metro ≥ 500
* Avg. successful outings per active family ≥ 1.5/week
* RSVP→attendance ≥ 60%
* Parent satisfaction (Would return?) ≥ 80%
* Venue verification freshness ≤ 30 days

---

# Customer Requirements (CRs)

**CR-1 Predictable Outings**
Parents need a list of nearby venues with sensory details that match reality by time of day.

**CR-2 Low-risk Social Time**
Parents want short, structured micro-events at vetted places with clear start, flow, and end.

**CR-3 Preparation & Calm**
Parents need visual walkthroughs and quick “what to expect” kits for a first visit.

**CR-4 Trust & Safety**
Parents want verified info, privacy control, simple reporting, and no public exposure of their child.

**CR-5 Low Planning Load**
Parents want one screen to decide “go now or not”, plus one tap to RSVP and get reminders.

**CR-6 Venue Partnership**
Venues want a lightweight playbook and a basic dashboard to host sensory hours and see attendance.

**CR-7 Data Freshness**
Everyone wants “last verified” stamps and corrections to be fast.

Out of scope for MVP: provider marketplace payments, broad forum/chat, clinical outcomes, complex matching.

---

# User Stories with Acceptance Criteria

### Parent discovery

* **US-P1** As a parent, I can browse a city Places page and filter by “Quiet Now”, “Quiet Room”, “No hand dryers”, “Sensory hours”, so I can pick a fit quickly.

  * *AC:* Filter chips update results within 300 ms.
  * *AC:* Each venue card shows Quiet/Moderate/Busy now + next 3 hours forecast.
  * *AC:* Each card shows “last verified” date.

* **US-P2** As a parent, I can open a venue and see a visual step sequence from parking to seating and bathrooms.

  * *AC:* Minimum 4 photos per venue with captions.
  * *AC:* Bathroom note includes hand dryer status.

* **US-P3** As a parent, I can RSVP to a micro-event in one tap and receive a calendar file and SMS reminder.

  * *AC:* RSVP confirmation page with .ics download.
  * *AC:* SMS reminder T-24h and T-2h.

* **US-P4** As a parent, I can generate a “First Visit Kit” for a venue.

  * *AC:* Auto-composed page with step list, likely triggers, quiet spots, staff contact, and simple social story blocks.

* **US-P5** As a parent, my child info stays private by default.

  * *AC:* No child name or photos shown to other users.
  * *AC:* Profile exposes only coarse attributes when RSVPed to the same event.

### Parent feedback

* **US-P6** As a parent, after an outing I can rate predictability and leave tips.

  * *AC:* 3-question structured review + optional text.
  * *AC:* Reviews badge “verified visit” when tied to an RSVP.

### Venue partner

* **US-V1** As a venue manager, I can submit sensory hour times, confirm amenities, and upload quiet-room signage.

  * *AC:* Form saves draft and publishes after admin approval.
  * *AC:* “Venue verified” shows who and when.

* **US-V2** As a venue manager, I can create an event and see RSVPs.

  * *AC:* Event goes live after admin approval.
  * *AC:* RSVP list shows count and anonymized needs flags.

### Operations

* **US-O1** As an ops admin, I can bulk import venues, queue verifications, and record “called and confirmed” with timestamp.

  * *AC:* Bulk CSV importer with schema validation.
  * *AC:* Verification task list by metro.

* **US-O2** As an ops admin, I can feature two weekly micro-events per metro and assign a host.

  * *AC:* Host receives auto checklists and reminder SMS.

### Safety and reporting

* **US-S1** As a parent, I can report an incident or a mismatch between description and reality.

  * *AC:* Report button on venue/event.
  * *AC:* Admins see queue with SLA tags.

---

# Technical Product Specification (Astro + Supabase + Mapbox)

## Architecture

* **Frontend:** Astro (content-focused, fast), Islands for interactive components (Search, Filters, RSVP).
* **API & Server:** Astro + Node endpoints, running on Vercel.
* **Database:** Supabase Postgres (row-level security, Auth).
* **Auth:** Supabase Auth, email + OTP as default; Google OAuth optional.
* **Storage:** Supabase storage buckets for venue photos and PDFs.
* **Maps:** Mapbox GL JS.
* **SMS/Email:** Twilio for SMS, Resend or SendGrid for email.
* **Analytics:** PostHog or Plausible for events.
* **Infra notes:** No PHI collected in MVP. Child profile is attribute-only, no names. Logging excludes PII.

## Data Model (Postgres)

```sql
-- Cities and venues
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id),
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  type text, -- museum, park, gym, theater, restaurant
  sensory_hours jsonb, -- [{day:"Sat", start:"09:00", end:"11:00"}]
  amenities jsonb, -- {quiet_room:true, lighting_control:true, hand_dryer:false, visual_supports:true}
  triggers jsonb, -- {strong_scents:false, loud_music:false, open_water:false}
  what_to_expect text,
  staff_contact text,
  last_verified timestamptz,
  verified_by uuid references profiles(id),
  photo_keys text[], -- storage keys
  status text default 'active'
);

-- Events (micro-groups and sensory hours we host or aggregate)
create table events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 12,
  host_profile_id uuid references profiles(id),
  visibility text default 'public', -- public or invite
  approved boolean default false
);

-- User profiles (parent or venue manager)
create table profiles (
  id uuid primary key default auth.uid(),
  role text check (role in ('parent','venue','admin')) not null,
  display_name text,
  city_id uuid references cities(id),
  child_age_band text, -- '2-4','5-7','8-10','11-13','14+'
  interests text[], -- ['lego','trains','animals','minecraft']
  communication text[], -- ['speaks','aac','gestures']
  sensory_flags jsonb, -- {hand_dryer:false, crowds:low, fluorescent:false}
  privacy jsonb, -- {show_to_event_peers_only:true}
  created_at timestamptz default now()
);

-- RSVPs
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  profile_id uuid references profiles(id),
  status text default 'going',
  created_at timestamptz default now(),
  unique(event_id, profile_id)
);

-- Reviews (post-visit)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  profile_id uuid references profiles(id),
  predictability int check (predictability between 1 and 5),
  staff_helpfulness int check (staff_helpfulness between 1 and 5),
  clarity_of_signage int check (clarity_of_signage between 1 and 5),
  would_return boolean,
  tips text,
  verified_visit boolean default false, -- set true when tied to RSVP attendance
  created_at timestamptz default now()
);

-- Verification tasks
create table verifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  assigned_to uuid references profiles(id),
  status text default 'open',
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

## Core Services

### “Go Now” Meter

* Input: historical busy hours per venue type + venue hours + local calendar.
* Phase 1: heuristic rules by type.
* Output: Quiet / Moderate / Busy now, plus 3-hour forecast.
* Store calculated state in Redis-like cache (or Postgres materialized view) and refresh every 15 minutes.

### First Visit Kit Generator

* Composes a page from venue data: photos with captions, likely triggers, quiet spots, staff notes, an optional printable PDF.
* Astro server route `/kit/:venueSlug` renders HTML to PDF using puppeteer-core on Vercel functions.

### Safety & Reporting

* Endpoint `POST /api/report` with type: incident, mismatch, accessibility.
* Admin queue with SLA tags and one-click venue update or event cancel.

## API Endpoints (Astro server routes)

```
GET  /api/cities
GET  /api/venues?city=:slug&filters=quiet_room,hand_dryer:false,...
GET  /api/venues/:id
POST /api/venues/:id/verify               (admin/venue)
POST /api/events                          (venue/admin)
GET  /api/events?city=:slug&date=YYYY-MM-DD
POST /api/rsvps                           (auth required)
POST /api/reviews                         (auth required, soft-rate-limit)
POST /api/report                          (auth required)
```

Auth policy: parents and venues via Supabase Auth. Admin role set via RLS.

## Astro Project Structure

```
/src
  /components
    VenueCard.astro
    VenueFiltersIsland.tsx
    MapIsland.tsx
    RSVPButtonIsland.tsx
    FirstVisitKit.astro
  /layouts
    Base.astro
  /pages
    index.astro
    /[city]/index.astro            -- city Places page
    /venue/[slug].astro
    /events/[city].astro
    /kit/[venueSlug].astro         -- printable kit
  /pages/api                        -- server routes
    cities.ts
    venues.ts
    venue-[id]-verify.ts
    events.ts
    rsvps.ts
    reviews.ts
    report.ts
  /lib
    db.ts                           -- Supabase client
    goNow.ts                        -- heuristic meter
    validation.ts                   -- zod schemas
    email.ts                        -- Resend/SendGrid
    sms.ts                          -- Twilio
```

## UI Flows

* **City Places**: header filters → list + map → click venue → RSVP to next micro-event or build kit
* **RSVP**: click RSVP → auth gate (email code) → confirm → .ics + SMS
* **Post-visit review**: T-4h after event, email + SMS link to 60-second review
* **Venue submit**: form wizard → admin approval queue

## Content & SEO

* Static pages per city: “Sensory-friendly guide to {City}” with internal links to venues and events
* Venue pages use JSON-LD `Place` + `AggregateRating` when available
* Events use `Event` schema
* Weekly “This Week’s Calm Windows” post per city, scheduled

## Privacy and Safety

* No child names or images stored in MVP
* RSVP shows only count and anonymized need flags to venue hosts
* Reviews redact PII by rule
* Delete and export my data endpoints available

---

# Team Model with Claude Code Agents

We will run **Claude Code agents** as role-specific copilots that produce drafts and raise checklists. A human lead owns final decisions.

| Role        | Agent Prompt (seed)                                                                                                      | Deliverables                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Product     | “You are a PM. Convert CRs into scoped releases and measurable outcomes. Flag scope creep.”                              | PRD v1, release notes, KPIs           |
| UX Lead     | “You are a UX lead. Produce wireframes in code blocks (Astro skeleton), content hierarchy, and states. Minimize clicks.” | Wireframes, component map             |
| Content     | “You write for parents. Plain language, short sentences, no jargon.”                                                     | City pages, kits, emails              |
| FE Engineer | “You are an Astro engineer. Generate components with accessibility first.”                                               | VenueCard.astro, filters, RSVP island |
| BE Engineer | “You are a Node/Supabase engineer. Write secure endpoints and zod validation.”                                           | API routes, DB migrations, RLS        |
| Data/ML     | “You prototype heuristics. Deliver a simple ‘Go Now’ meter and improve with logs.”                                       | goNow.ts baseline, evaluation plan    |
| Ops         | “You run verification. Output call scripts, QA checklists, and import mapping.”                                          | SOPs, Airtable→CSV schema             |
| QA          | “You break flows. Write test cases, edge scenarios, and acceptance checklists.”                                          | Test plan, regression suite           |
| Compliance  | “You reduce risk. Review data flows and mark risk notes.”                                                                | Data map, privacy copy                |
| Growth      | “You drive adoption. Propose launch calendar, SEO targets, referral hooks.”                                              | City launch plan, weekly calendar     |

**Agent orchestration**

* GitHub PR templates include a “Claude Review” checklist.
* Each PR prompts the relevant agent to add test cases and acceptance notes.
* Weekly “agent standup” script compiles risks and open decisions.

---

# Project Plan

**Week 1**

* Finalize CRs, user stories, UI map
* DB schema + migrations
* City and venue pages scaffold in Astro

**Week 2**

* Venue importer + admin verification queue
* Map, filters, “Go Now” heuristic v0

**Week 3**

* Venue detail with First Visit Kit generator
* RSVP flow with auth and .ics + SMS

**Week 4**

* Events calendar per city, host tooling
* Review flow post-visit

**Week 5**

* Safety reporting and moderation queue
* Venue partner self-serve submission

**Week 6**

* Content: two city guides, internal links
* Analytics events and dashboards

**Week 7**

* Accessibility, performance hardening
* Soft launch in City A

**Week 8**

* Fixes from live data
* Launch City B, press + community partners

---

# Non-functional Requirements

* Core web vitals green on mobile
* P95 API latency < 300 ms
* 99.9% uptime target (Vercel + Supabase)
* Error budget tracked in PostHog
* Accessibility: keyboard navigation, sufficient contrast, alt text required on all photos

---

# Risks and Mitigations

* **Data drift**. Mitigate with verification tasks, “last verified” banners, and report-a-mismatch speed.
* **Low event attendance**. Seed two anchor micro-events per city with partners and reminder SMS.
* **Safety incidents**. Clear incident flow, quick moderation, and remove venues that do not meet standards.

---

# Definition of Done (MVP)

* Two metros live with ≥ 150 venues each and “last verified” under 30 days
* At least two weekly micro-events per metro with RSVP and reminders
* First Visit Kit available for top 50 venues per metro
* Reviews active and linked to RSVPs
* “This Week’s Calm Windows” posts scheduled for both metros
* Baseline KPIs instrumented in dashboard

---

If you want, I can output a starter **Astro repo structure + first components** and a **Supabase migration file** you can paste into your dev environment.
