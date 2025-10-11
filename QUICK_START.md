# findABA.care.com - Quick Start Guide

## Overview

This guide will help you get the findABA.care MVP up and running in **one development session**.

---

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Supabase** account (free tier)
- **Mapbox** account and token
- **Twilio** account (for SMS)
- **Resend** account (for email)
- **Git** installed

---

## Step 1: Initialize Project (15 minutes)

### 1.1 Create Astro Project

```bash
cd "/Users/ez/Desktop/AI Library/Apps/findABA.care"
pnpm create astro@latest . --template minimal --typescript strict --git
```

Select:
- TypeScript: **Strict**
- Install dependencies: **Yes**
- Git: **Yes** (already initialized)

### 1.2 Install Dependencies

```bash
pnpm add @astrojs/tailwind astro dayjs mapbox-gl posthog-js zod @supabase/supabase-js @supabase/ssr @tanstack/react-query react react-dom @types/mapbox-gl

pnpm add -D @types/react @types/react-dom autoprefixer postcss prettier tailwindcss typescript tsx
```

### 1.3 Configure Astro

Update `astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  integrations: [tailwind({ applyBaseStyles: true })],
  server: { port: 4321 },
});
```

### 1.4 Initialize Tailwind

```bash
pnpm dlx tailwindcss init -p
```

Update `tailwind.config.cjs`:
```javascript
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

---

## Step 2: Set Up Supabase (20 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Create new project: **findabacare**
3. Choose region: **US West**
4. Set strong database password
5. Wait for provisioning (~2 minutes)

### 2.2 Run Database Schema

Copy the schema from `/supabase/schema.sql` (from the MVP starter repo document) and run in Supabase SQL Editor:

```sql
create extension if not exists "uuid-ossp";

-- Cities
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null
);

-- Profiles (parent/venue/admin)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user uuid,
  role text check (role in ('parent','venue','admin')) not null,
  display_name text,
  city_id uuid references public.cities(id),
  child_age_band text,
  interests text[],
  communication text[],
  sensory_flags jsonb,
  privacy jsonb,
  created_at timestamptz default now()
);

-- Venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id),
  name text not null,
  slug text unique,
  address text,
  lat double precision,
  lng double precision,
  type text,
  sensory_hours jsonb,
  amenities jsonb,
  triggers jsonb,
  what_to_expect text,
  staff_contact text,
  last_verified timestamptz,
  verified_by uuid references public.profiles(id),
  photo_keys text[],
  status text default 'active'
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 12,
  host_profile_id uuid references public.profiles(id),
  visibility text default 'public',
  approved boolean default false
);

-- RSVPs
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  status text default 'going',
  created_at timestamptz default now(),
  unique(event_id, profile_id)
);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  predictability int check (predictability between 1 and 5),
  staff_helpfulness int check (staff_helpfulness between 1 and 5),
  clarity_of_signage int check (clarity_of_signage between 1 and 5),
  would_return boolean,
  tips text,
  verified_visit boolean default false,
  created_at timestamptz default now()
);

-- Verifications
create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  status text default 'open',
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Go Now Cache
create table public.gonow_cache (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  updated_at timestamptz not null default now(),
  meter text not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.rsvps enable row level security;
alter table public.reviews enable row level security;

-- Basic policies
create policy "profiles_read" on public.profiles for select using (true);
create policy "rsvps_read" on public.rsvps for select using (true);
create policy "reviews_read" on public.reviews for select using (true);
```

### 2.3 Seed Cities

```sql
insert into cities (name, state, slug) values
  ('Dallas','TX','dallas'),
  ('Houston','TX','houston');
```

### 2.4 Get API Keys

In Supabase Project Settings → API:
- Copy **Project URL** → `SUPABASE_URL`
- Copy **anon public key** → `SUPABASE_ANON_KEY`

---

## Step 3: Environment Variables (5 minutes)

Create `.env`:
```ini
# Supabase
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."

# Mapbox
MAPBOX_TOKEN="pk.eyJ1..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="hello@findabacare.com"

# SMS (Twilio) - Optional for MVP
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_FROM_NUMBER="+15551234567"

# Analytics (PostHog) - Optional
POSTHOG_KEY="phc_xxx"
POSTHOG_HOST="https://us.i.posthog.com"

# Admin (temporary basic auth)
ADMIN_BASIC_USER="admin"
ADMIN_BASIC_PASS="changeme123"

# Cron token
CRON_TOKEN="random-secure-string-123"
```

Create `.env.example` (same as above but with placeholder values).

Update `.gitignore`:
```
node_modules
.dist
.vercel
.env
.DS_Store
pnpm-lock.yaml
```

---

## Step 4: Core File Structure (10 minutes)

```bash
mkdir -p src/{lib,components,layouts,pages/api}
mkdir -p supabase/seed
mkdir -p scripts
```

Create these starter files (copy from MVP Starter Repo document):

### 4.1 Library Files

**src/lib/db.ts**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

**src/lib/goNow.ts**
```typescript
import dayjs from 'dayjs';

type Meter = 'Quiet' | 'Moderate' | 'Busy';

const heuristics: Record<string, (d: Date) => Meter> = {
  museum: (d) => {
    const h = dayjs(d).hour();
    if (h < 11) return 'Quiet';
    if (h < 15) return 'Moderate';
    return 'Busy';
  },
  park: (d) => {
    const h = dayjs(d).hour();
    if (h < 10 || h > 18) return 'Quiet';
    if (h < 16) return 'Moderate';
    return 'Busy';
  },
  default: () => 'Moderate',
};

export function goNow(venueType?: string, at: Date = new Date()): Meter {
  const fn = (venueType && heuristics[venueType]) || heuristics.default;
  return fn(at);
}
```

**src/lib/validation.ts**
```typescript
import { z } from 'zod';

export const RSVPCreate = z.object({
  event_id: z.string().uuid(),
});

export const ReviewCreate = z.object({
  venue_id: z.string().uuid(),
  predictability: z.number().min(1).max(5),
  staff_helpfulness: z.number().min(1).max(5),
  clarity_of_signage: z.number().min(1).max(5),
  would_return: z.boolean(),
  tips: z.string().max(1000).optional(),
});

export type RSVPCreateInput = z.infer<typeof RSVPCreate>;
export type ReviewCreateInput = z.infer<typeof ReviewCreate>;
```

---

## Step 5: Start Development (5 minutes)

```bash
pnpm dev
```

Visit: http://localhost:4321

---

## Step 6: Next Actions

Now that your foundation is set up, proceed with:

1. **Week 1**: Build components and pages (see DEVELOPMENT_PLAN.md Phase 3-4)
2. **Week 2**: Create API routes (Phase 5)
3. **Week 3**: Add authentication and admin portal (Phase 6-7)
4. **Week 4**: Automation and seeding (Phase 8-9)
5. **Week 5-6**: Testing and optimization (Phase 12-13)
6. **Week 7-8**: Deploy and launch (Phase 14-15)

---

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Type checking
pnpm typecheck        # Run TypeScript compiler

# Formatting
pnpm format           # Format with Prettier

# Database
# Run SQL in Supabase SQL Editor

# Seeding
pnpm tsx scripts/fetch_venues.ts "Dallas, TX" <CITY_UUID>
```

---

## Troubleshooting

### Issue: "Module not found: @supabase/supabase-js"
**Solution**: Run `pnpm install`

### Issue: "Cannot find module 'astro'"
**Solution**: Ensure Astro is in dependencies, run `pnpm add astro`

### Issue: Database connection errors
**Solution**: Check `.env` has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### Issue: Port 4321 already in use
**Solution**: Change port in `astro.config.mjs` or kill existing process

---

## Resources

- **Astro Docs**: https://docs.astro.build
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js

---

## Support

For questions or issues:
- Review `DEVELOPMENT_PLAN.md` for detailed implementation steps
- Check the MVP Starter Repo document for complete code examples
- Reference the Product Vision document for user stories and requirements

---

**You're ready to build!** Start with Phase 1 tasks in the todo list and follow the development plan.
