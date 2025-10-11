# findABA.care MVP Starter Repo (Astro + Supabase)

> **Stack:** Astro (TypeScript) + Supabase (Postgres/Auth/Storage) + Mapbox + Twilio (SMS) + Resend (Email) + Zod + PostHog

This starter gives you the file tree, core pages, API routes, DB schema, and minimal components to launch the **Places + Micro-Events + RSVP** MVP in two metros.

---

## 1) File Tree

```
findabacare/
├─ .env.example
├─ .gitignore
├─ package.json
├─ pnpm-lock.yaml (generated)
├─ astro.config.mjs
├─ tsconfig.json
├─ postcss.config.cjs
├─ tailwind.config.cjs
├─ README.md
├─ /supabase
│  └─ schema.sql
├─ /src
│  ├─ env.d.ts
│  ├─ /lib
│  │  ├─ db.ts
│  │  ├─ goNow.ts
│  │  ├─ validation.ts
│  │  ├─ email.ts
│  │  ├─ sms.ts
│  │  └─ utils.ts
│  ├─ /components
│  │  ├─ VenueCard.astro
│  │  ├─ VenueFiltersIsland.tsx
│  │  ├─ MapIsland.tsx
│  │  └─ RSVPButtonIsland.tsx
│  ├─ /layouts
│  │  └─ Base.astro
│  └─ /pages
│     ├─ index.astro
│     ├─ [city]/index.astro
│     ├─ venue/[slug].astro
│     ├─ events/[city].astro
│     ├─ kit/[venueSlug].astro
│     └─ /api
│        ├─ cities.ts
│        ├─ venues.ts
│        ├─ events.ts
│        ├─ rsvps.ts
│        ├─ reviews.ts
│        ├─ report.ts
│        └─ health.ts
```

---

## 2) Environment

**.env.example**

```ini
# Supabase
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR-ANON-KEY"
SUPABASE_SERVICE_ROLE="YOUR-SERVICE-ROLE-KEY" # server-only endpoints (optional for MVP)

# Mapbox
MAPBOX_TOKEN="YOUR-MAPBOX-TOKEN"

# Email (Resend)
RESEND_API_KEY="YOUR-RESEND-API-KEY"
EMAIL_FROM="hello@findabacare.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_FROM_NUMBER="+15551234567"

# Analytics
POSTHOG_KEY="phc_xxx"
POSTHOG_HOST="https://us.i.posthog.com" # or default
```

**.gitignore**

```
node_modules
.dist
.vercel
.env
pnpm-lock.yaml
.DS_Store
```

---

## 3) Package & Config

**package.json**

```json
{
  "name": "findabacare",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@astrojs/tailwind": "^6.0.0",
    "astro": "^4.14.0",
    "dayjs": "^1.11.13",
    "mapbox-gl": "^3.6.0",
    "posthog-js": "^1.150.0",
    "zod": "^3.23.8",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.56.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/mapbox-gl": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.74",
    "@types/react-dom": "^18.2.24",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "prettier": "^3.3.3",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.6.3"
  }
}
```

**astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server', // needed for API routes on Vercel
  integrations: [tailwind({ applyBaseStyles: true })],
  server: { port: 4321 },
});
```

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "types": ["@types/mapbox-gl"]
  }
}
```

**tailwind.config.cjs**

```js
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

**postcss.config.cjs**

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

**src/env.d.ts**

```ts
/// <reference types="astro/client" />
```

---

## 4) Supabase Schema

**/supabase/schema.sql**

```sql
create extension if not exists "uuid-ossp";

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null
);

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

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id),
  name text not null,
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

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  status text default 'going',
  created_at timestamptz default now(),
  unique(event_id, profile_id)
);

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

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  status text default 'open',
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Suggested RLS stubs (tighten in production)
alter table public.profiles enable row level security;
alter table public.rsvps enable row level security;
alter table public.reviews enable row level security;

-- Example policies
create policy "profiles_read" on public.profiles for select using (true);
create policy "rsvps_owner" on public.rsvps for select using (true);
create policy "reviews_read" on public.reviews for select using (true);
```

---

## 5) Library Helpers

**/src/lib/db.ts**

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

**/src/lib/goNow.ts**

```ts
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

**/src/lib/validation.ts**

```ts
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

**/src/lib/email.ts**

```ts
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error('Email error', await res.text());
}
```

**/src/lib/sms.ts**

```ts
export async function sendSMS(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID) return;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const form = new URLSearchParams({
    To: to,
    From: process.env.TWILIO_FROM_NUMBER!,
    Body: body,
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  if (!res.ok) console.error('SMS error', await res.text());
}
```

---

## 6) Components

**/src/components/VenueCard.astro**

```astro
---
const { venue } = Astro.props as { venue: any };
import { goNow } from '../lib/goNow';
const meter = goNow(venue.type);
---
<article class="p-4 rounded-2xl border flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">{venue.name}</h3>
    <span class="text-sm px-2 py-1 rounded-full border">{meter}</span>
  </div>
  <p class="text-sm text-gray-600">{venue.address}</p>
  <div class="flex gap-2 text-xs text-gray-700">
    {venue.amenities?.quiet_room && <span class="px-2 py-1 bg-gray-100 rounded">Quiet room</span>}
    {venue.amenities?.visual_supports && <span class="px-2 py-1 bg-gray-100 rounded">Visual supports</span>}
    {venue.amenities?.hand_dryer === false && <span class="px-2 py-1 bg-gray-100 rounded">No hand dryers</span>}
  </div>
  <p class="text-xs text-gray-500">Last verified: {new Date(venue.last_verified).toLocaleDateString()}</p>
  <a href={`/venue/${venue.slug}`} class="text-blue-600 text-sm mt-1">View details →</a>
</article>
```

**/src/components/VenueFiltersIsland.tsx**

```tsx
import { useState } from 'react';

type Props = { onChange: (f: Record<string, string | boolean>) => void };
export default function VenueFiltersIsland({ onChange }: Props) {
  const [quietRoom, setQuietRoom] = useState(false);
  const [noDryers, setNoDryers] = useState(false);
  const [sensoryHours, setSensoryHours] = useState(false);

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={quietRoom} onChange={e => {setQuietRoom(e.target.checked); onChange({ quiet_room: e.target.checked });}} />
        Quiet room
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={noDryers} onChange={e => {setNoDryers(e.target.checked); onChange({ hand_dryer: e.target.checked ? 'false' : '' });}} />
        No hand dryers
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sensoryHours} onChange={e => {setSensoryHours(e.target.checked); onChange({ sensory_hours: e.target.checked });}} />
        Sensory hours
      </label>
    </div>
  );
}
```

**/src/components/MapIsland.tsx**

```tsx
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapIsland({ venues }: { venues: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore
    mapboxgl.accessToken = import.meta.env.MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [venues[0]?.lng || -96.8, venues[0]?.lat || 32.77],
      zoom: 10,
    });
    venues.forEach(v => {
      if (!v.lng || !v.lat) return;
      new mapboxgl.Marker().setLngLat([v.lng, v.lat]).addTo(map);
    });
    return () => map.remove();
  }, [venues]);

  return <div ref={mapRef} style={{ width: '100%', height: '320px', borderRadius: '12px' }} />;
}
```

**/src/components/RSVPButtonIsland.tsx**

```tsx
import { useState } from 'react';

export default function RSVPButtonIsland({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function rsvp() {
    setLoading(true);
    const res = await fetch('/api/rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId })
    });
    setLoading(false);
    if (res.ok) setDone(true);
  }

  return (
    <button onClick={rsvp} disabled={loading || done} className="px-4 py-2 rounded-lg bg-black text-white">
      {done ? 'RSVP’d' : loading ? 'Saving…' : 'RSVP'}
    </button>
  );
}
```

---

## 7) Layout & Pages

**/src/layouts/Base.astro**

```astro
---
const { title = 'findABA.care' } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-white text-gray-900">
    <header class="p-4 border-b">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <a href="/" class="font-semibold">findABA.care</a>
        <nav class="text-sm flex gap-4">
          <a href="/events/dallas">Dallas</a>
          <a href="/events/houston">Houston</a>
        </nav>
      </div>
    </header>
    <main class="max-w-6xl mx-auto p-4">
      <slot />
    </main>
  </body>
</html>
```

**/src/pages/index.astro**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Find places and moments that work for your child">
  <h1 class="text-2xl font-semibold mb-2">Find places and moments that work for your child</h1>
  <p class="text-gray-700 mb-6">Quiet hours, visual guides, and small-group meetups verified by local parents.</p>
  <div class="grid sm:grid-cols-2 gap-4">
    <a href="/dallas" class="p-4 border rounded-xl">Dallas, TX →</a>
    <a href="/houston" class="p-4 border rounded-xl">Houston, TX →</a>
  </div>
</Base>
```

**/src/pages/[city]/index.astro**

```astro
---
import Base from '../../layouts/Base.astro';
import VenueCard from '../../components/VenueCard.astro';
import MapIsland from '../../components/MapIsland.tsx';
import VenueFiltersIsland from '../../components/VenueFiltersIsland.tsx';
import { supabase } from '../../lib/db';

const { city } = Astro.params;
const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', city).single();
const { data: venues } = await supabase.from('venues').select('*').eq('city_id', cityRow?.id).limit(100);
---
<Base title={`Sensory-friendly places in ${cityRow?.name}`}>
  <div class="mb-4"><VenueFiltersIsland client:load onChange={() => {}} /></div>
  <div class="mb-4"><MapIsland client:load venues={venues || []} /></div>
  <div class="grid md:grid-cols-2 gap-4">
    {venues?.map(v => <VenueCard venue={v} />)}
  </div>
</Base>
```

**/src/pages/venue/[slug].astro**

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';

const { slug } = Astro.params;
const { data: venue } = await supabase.from('venues').select('*').eq('slug', slug).single();
---
<Base title={venue?.name}>
  <h1 class="text-2xl font-semibold">{venue?.name}</h1>
  <p class="text-gray-700">{venue?.address}</p>
  <section class="mt-4 space-y-2">
    <h2 class="font-semibold">What to expect</h2>
    <p class="text-sm">{venue?.what_to_expect}</p>
    <a href={`/kit/${slug}`} class="text-blue-600 text-sm">First Visit Kit →</a>
  </section>
</Base>
```

**/src/pages/events/[city].astro**

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';

const { city } = Astro.params;
const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', city).single();
const { data: events } = await supabase.from('events').select('*, venues(*)').in('venue_id', (await supabase.from('venues').select('id').eq('city_id', cityRow?.id)).data?.map(v=>v.id) || []).order('date');
---
<Base title={`Events in ${cityRow?.name}`}>
  <h1 class="text-xl font-semibold mb-4">This week's micro-groups</h1>
  <div class="space-y-3">
    {events?.map(e => (
      <article class="p-4 border rounded-xl">
        <h3 class="font-semibold">{e.title}</h3>
        <p class="text-sm text-gray-700">{e.venues?.name} · {e.date} {e.start_time}-{e.end_time}</p>
      </article>
    ))}
  </div>
</Base>
```

**/src/pages/kit/[venueSlug].astro**

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';

const { venueSlug } = Astro.params;
const { data: venue } = await supabase.from('venues').select('*').eq('slug', venueSlug).single();
---
<Base title={`First Visit Kit · ${venue?.name}`}>
  <h1 class="text-xl font-semibold mb-4">First Visit Kit</h1>
  <ol class="list-decimal pl-6 space-y-2 text-sm">
    <li>Parking → entrance photos</li>
    <li>Ticketing / entry area</li>
    <li>Seating / quiet room location</li>
    <li>Bathrooms (hand dryer: {String(venue?.amenities?.hand_dryer)})</li>
  </ol>
</Base>
```

---

## 8) API Routes (Minimal)

**/src/pages/api/health.ts**

```ts
import type { APIRoute } from 'astro';
export const GET: APIRoute = async () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
```

**/src/pages/api/cities.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';
export const GET: APIRoute = async () => {
  const { data } = await supabase.from('cities').select('*').order('name');
  return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
};
```

**/src/pages/api/venues.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city');
  let query = supabase.from('venues').select('*').order('name');
  if (city) {
    const { data: c } = await supabase.from('cities').select('id').eq('slug', city).single();
    if (c?.id) query = query.eq('city_id', c.id);
  }
  const { data } = await query;
  return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
};
```

**/src/pages/api/events.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city');
  if (!city) return new Response(JSON.stringify([]));
  const { data: c } = await supabase.from('cities').select('id').eq('slug', city).single();
  const { data: v } = await supabase.from('venues').select('id').eq('city_id', c?.id);
  const ids = v?.map((x: any) => x.id) || [];
  const { data: events } = await supabase.from('events').select('*').in('venue_id', ids).order('date');
  return new Response(JSON.stringify(events || []), { headers: { 'Content-Type': 'application/json' } });
};
```

**/src/pages/api/rsvps.ts**

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../lib/db';

const bodySchema = z.object({ event_id: z.string().uuid() });

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  // MVP: anonymous profile placeholder (replace with Supabase Auth later)
  const { data: profile } = await supabase.from('profiles').insert({ role: 'parent', display_name: 'Guest' }).select('*').single();
  await supabase.from('rsvps').insert({ event_id: parsed.data.event_id, profile_id: profile!.id });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
```

**/src/pages/api/reviews.ts**

```ts
import type { APIRoute } from 'astro';
import { ReviewCreate } from '../../lib/validation';
import { supabase } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const parsed = ReviewCreate.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400 });
  await supabase.from('reviews').insert(parsed.data);
  return new Response(JSON.stringify({ ok: true }));
};
```

**/src/pages/api/report.ts**

```ts
import type { APIRoute } from 'astro';
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  console.log('REPORT', body); // wire to moderation inbox later
  return new Response(JSON.stringify({ ok: true }));
};
```

---

## 9) README (Quick Start)

**README.md**

````md
# findABA.care MVP (Places + Micro-Events)

## Prerequisites
- Node 18+
- pnpm (recommended)
- Supabase project (free tier ok)
- Mapbox token

## Setup
1. `pnpm install`
2. Create database: run `/supabase/schema.sql` in Supabase SQL Editor
3. Copy `.env.example` to `.env` and fill values
4. `pnpm dev` → http://localhost:4321

## Seed (optional)
Insert a couple of cities and venues in Supabase:
```sql
insert into cities (name, state, slug) values ('Dallas','TX','dallas'), ('Houston','TX','houston');
insert into venues (city_id, name, address, lat, lng, type, amenities, last_verified)
select id, 'Perot Museum', '2201 N Field St, Dallas, TX', 32.786, -96.806, 'museum', '{"quiet_room": true, "hand_dryer": false, "visual_supports": true}'::jsonb, now()
from cities where slug='dallas';
````

## Deploy

* Vercel: Framework = Astro, set env vars, connect Supabase URL/keys
* Supabase: Auth optional for MVP; enable RLS before production

## Next

* Replace anonymous RSVP with Supabase Auth (email OTP)
* Add admin approval for venue/event submissions
* Implement weekly "Calm Windows" posts (SSG) per city

````


---

## 10) Supabase Auth (Email OTP) wiring

### Install
```bash
pnpm add @supabase/supabase-js
````

### Client Auth helper

**/src/lib/auth.ts**

```ts
import { createClient } from '@supabase/supabase-js';
export const supabaseClient = createClient(
  import.meta.env.SUPABASE_URL!,
  import.meta.env.SUPABASE_ANON_KEY!
);
```

### Auth UI (minimal email OTP)

**/src/components/AuthIsland.tsx**

```tsx
import { useState } from 'react';
import { supabaseClient } from '../lib/auth';

export default function AuthIsland() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  async function signIn() {
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (!error) setSent(true);
  }
  return (
    <div className="p-4 border rounded-xl">
      {sent ? (
        <p className="text-sm">Check your email for a sign-in link.</p>
      ) : (
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 flex-1" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="px-4 py-2 rounded bg-black text-white" onClick={signIn}>Sign in</button>
        </div>
      )}
    </div>
  );
}
```

### Server-side auth check (API)

Update API routes to require auth for RSVPs & Reviews.

**/src/pages/api/rsvps.ts** (replace body with):

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../lib/db';

const bodySchema = z.object({ event_id: z.string().uuid() });

export const POST: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { data: user, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !user?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });

  // Upsert profile mapped to auth user id
  const { data: profile } = await supabase.from('profiles')
    .upsert({ auth_user: user.user.id, role: 'parent', display_name: user.user.email || 'Parent' }, { onConflict: 'auth_user' })
    .select('*').single();

  await supabase.from('rsvps').insert({ event_id: parsed.data.event_id, profile_id: profile!.id });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
```

**/src/pages/api/reviews.ts** (replace body with):

```ts
import type { APIRoute } from 'astro';
import { ReviewCreate } from '../../lib/validation';
import { supabase } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { data: user, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !user?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const parsed = ReviewCreate.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user', user.user.id).single();
  await supabase.from('reviews').insert({ ...parsed.data, profile_id: profile!.id });
  return new Response(JSON.stringify({ ok: true }));
};
```

### Client helper to attach JWT on fetch

**/src/lib/authedFetch.ts**

```ts
import { supabaseClient } from './auth';
export async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}
```

### Use in RSVP button

**/src/components/RSVPButtonIsland.tsx** (replace fetch call):

```tsx
import { authedFetch } from '../lib/authedFetch';
// ...
const res = await authedFetch('/api/rsvps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event_id: eventId })
});
```

Add **AuthIsland** to header (optional gate before RSVP):

```astro
---
import AuthIsland from '../components/AuthIsland.tsx';
---
<AuthIsland client:load />
```

---

## 11) Bulk CSV Importer for Venues

### Route (admin-only in MVP)

**/src/pages/api/admin/import-venues.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const text = await request.text();
  const rows = text.split('
').map(l => l.trim()).filter(Boolean);
  const [header, ...data] = rows;
  const cols = header.split(',').map(c => c.trim());
  const toObj = (arr: string[]) => Object.fromEntries(arr.map((v, i) => [cols[i], v]));

  const upserts = data.map(r => {
    const obj = toObj(r.split(','));
    return {
      name: obj.name,
      address: obj.address,
      lat: parseFloat(obj.lat),
      lng: parseFloat(obj.lng),
      type: obj.type,
      city_id: obj.city_id,
      amenities: { quiet_room: obj.quiet_room === 'true', hand_dryer: obj.hand_dryer === 'false' ? false : true, visual_supports: obj.visual_supports === 'true' },
      last_verified: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('venues').insert(upserts);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ ok: true, count: upserts.length }));
};
```

### Sample CSV

**/supabase/seed/venues.sample.csv**

```
name,address,lat,lng,type,city_id,quiet_room,hand_dryer,visual_supports
Perot Museum,2201 N Field St,32.786,-96.806,museum,{{DALLAS_CITY_ID}},true,false,true
Dallas Museum of Art,1717 N Harwood St,32.787,-96.800,museum,{{DALLAS_CITY_ID}},true,false,true
Children's Museum Houston,1500 Binz St,29.725,-95.384,museum,{{HOUSTON_CITY_ID}},true,false,true
Hermann Park,6001 Fannin St,29.719,-95.389,park,{{HOUSTON_CITY_ID}},false,true,false
```

Use `curl` to import:

```bash
curl -X POST --data-binary @supabase/seed/venues.sample.csv \
  http://localhost:4321/api/admin/import-venues
```

---

## 12) City Seed SQL (Dallas & Houston)

**/supabase/seed/cities.sql**

```sql
insert into cities (name, state, slug) values
  ('Dallas','TX','dallas') on conflict do nothing;
insert into cities (name, state, slug) values
  ('Houston','TX','houston') on conflict do nothing;
```

**Fetch IDs for CSV placeholders**

```sql
select id, slug from cities where slug in ('dallas','houston');
```

Replace `{{DALLAS_CITY_ID}}` and `{{HOUSTON_CITY_ID}}` in the CSV and run the import.

---

## 13) Starter Events Seed

**/supabase/seed/events.sql**

```sql
-- assumes venues exist
insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
select v.id, 'LEGO Micro-Group (30 min)', 'Structured build time for ages 5–8', current_date + 3, '10:00','10:30', 8, true
from venues v join cities c on v.city_id=c.id where c.slug='dallas' limit 1;

insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
select v.id, 'Quiet Hour Park Meetup', 'Short sensory-friendly park hang', current_date + 4, '09:00','09:45', 12, true
from venues v join cities c on v.city_id=c.id where c.slug='houston' limit 1;
```

---

## 14) Frontend tweaks for Auth + RSVP

Add a small guard so unauthenticated users are prompted to sign in before RSVP.

**/src/components/RSVPButtonIsland.tsx** (guard)

```tsx
import { supabaseClient } from '../lib/auth';
// ... inside rsvp():
const { data: { session } } = await supabaseClient.auth.getSession();
if (!session) { alert('Please sign in first.'); return; }
```

Add Auth UI to the **/events/[city].astro** page header for convenience.

```astro
---
import AuthIsland from '../../components/AuthIsland.tsx';
---
<div class="mb-4"><AuthIsland client:load /></div>
```

---

## 15) QA Checklist (smoke)

* Can sign in with email link → session exists on client
* City pages render 50+ venues < 1.5s TTFB
* Import CSV creates venues, shows on city map/list
* RSVP requires auth; creates row; button flips to RSVP’d
* Reviews endpoint rejects unauth; accepts valid payload
* “Last verified” visible; date updates after import

---

## 16) Next Up (optional)

* Admin UI for approvals and verifications queue
* iCal feed per city (subscribe to weekly calm windows)
* Attendance marking to toggle `verified_visit` on reviews

---

## 17) Admin Verification Queue UI

### Admin routes (Astro pages)

**/src/pages/admin/index.astro**

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';
const { data: open } = await supabase.from('verifications')
  .select('id, created_at, notes, venues(name, city_id)')
  .eq('status','open')
  .order('created_at', { ascending: true });
---
<Base title="Admin · Verification Queue">
  <h1 class="text-xl font-semibold mb-4">Verification Queue</h1>
  <div class="space-y-3">
    {open?.map((t:any) => (
      <article class="p-4 border rounded-xl flex items-center justify-between">
        <div>
          <div class="font-medium">{t.venues?.name}</div>
          <div class="text-xs text-gray-600">Task #{t.id} · {new Date(t.created_at).toLocaleString()}</div>
        </div>
        <div class="flex gap-2">
          <form method="post" action={`/api/admin/verify?id=${t.id}&action=confirm`}>
            <button class="px-3 py-2 rounded bg-green-600 text-white text-sm">Confirm</button>
          </form>
          <form method="post" action={`/api/admin/verify?id=${t.id}&action=reject`}>
            <button class="px-3 py-2 rounded bg-red-600 text-white text-sm">Reject</button>
          </form>
        </div>
      </article>
    ))}
  </div>
</Base>
```

### API endpoint

**/src/pages/api/admin/verify.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';

export const POST: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');
  if (!id || !action) return new Response(JSON.stringify({ error: 'Bad req' }), { status: 400 });

  const { data: task } = await supabase.from('verifications').select('venue_id').eq('id', id).single();
  if (!task) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  if (action === 'confirm') {
    await supabase.from('venues').update({ last_verified: new Date().toISOString() }).eq('id', task.venue_id);
    await supabase.from('verifications').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id);
  } else {
    await supabase.from('verifications').update({ status: 'rejected', completed_at: new Date().toISOString() }).eq('id', id);
  }

  return new Response(null, { status: 302, headers: { Location: '/admin' } });
};
```

> **Note:** Add a simple admin check later (e.g., `profiles.role='admin'`) and secure this route with auth middleware.

---

## 18) “This Week’s Calm Windows” SSG Post per City

### Generator (build-time)

**/src/pages/[city]/calm-windows.astro**

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';
import dayjs from 'dayjs';

export async function getStaticPaths() {
  const { data: cities } = await supabase.from('cities').select('slug');
  return (cities || []).map((c:any) => ({ params: { city: c.slug } }));
}

const { city } = Astro.params;
const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', city).single();
const { data: venues } = await supabase.from('venues').select('*').eq('city_id', cityRow?.id).limit(200);

const week = Array.from({ length: 7 }).map((_, i) => dayjs().add(i, 'day'));
function calmWindowFor(v:any, d:any) {
  // heuristic: museums 9–11, parks 8–10, theaters first shows
  if (v.type === 'museum') return `${d.format('ddd MMM D')} · 9:00–11:00`;
  if (v.type === 'park') return `${d.format('ddd MMM D')} · 8:00–10:00`;
  return `${d.format('ddd MMM D')} · check venue hours`;
}
---
<Base title={`Calm windows this week · ${cityRow?.name}`}>
  <h1 class="text-2xl font-semibold mb-2">This Week’s Calm Windows</h1>
  <p class="text-sm text-gray-700 mb-6">Suggested low‑crowd times, by venue type. Verified venues may list sensory hours explicitly.</p>
  <div class="space-y-6">
    {venues?.slice(0, 30).map((v:any) => (
      <section class="p-4 border rounded-xl">
        <h2 class="font-medium">{v.name}</h2>
        <ul class="list-disc pl-5 text-sm mt-2">
          {week.map((d:any) => <li>{calmWindowFor(v, d)}</li>)}
        </ul>
      </section>
    ))}
  </div>
</Base>
```

> Add an index link from each city page to `/[city]/calm-windows`.

**/src/pages/[city]/index.astro** (add link under header)

```astro
<p class="text-sm mb-3"><a href={`/${city}/calm-windows`} class="text-blue-600">This week’s calm windows →</a></p>
```

---

## 19) Dockerized Dev Environment

**Dockerfile**

```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
ENV PORT=4321
EXPOSE 4321
CMD ["pnpm","dev","--","--host","0.0.0.0"]
```

**docker-compose.yml**

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "4321:4321"
    env_file:
      - .env
    volumes:
      - ./:/app
      - /app/node_modules
```

> You’ll still use a hosted Supabase project. If you prefer local Postgres, add a `db` service and point env vars accordingly.

---

## 20) iCal Feeds per City (Optional Nice-to-Have)

**/src/pages/[city]/calendar.ics.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const city = params.city!;
  const { data: c } = await supabase.from('cities').select('id,name').eq('slug', city).single();
  const { data: v } = await supabase.from('venues').select('id').eq('city_id', c?.id);
  const ids = v?.map((x:any) => x.id) || [];
  const { data: events } = await supabase.from('events').select('*').in('venue_id', ids).order('date');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `X-WR-CALNAME:Calm Windows · ${c?.name}`,
  ];
  (events||[]).forEach((e:any) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id}@findabacare.com`);
    lines.push(`DTSTART:${e.date.toString().replace(/-/g,'')}T${e.start_time.replace(':','')}00Z`);
    lines.push(`DTEND:${e.date.toString().replace(/-/g,'')}T${e.end_time.replace(':','')}00Z`);
    lines.push(`SUMMARY:${e.title}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');

  return new Response(lines.join('
'), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
```

---

## 21) Admin Access (temporary)

Add a quick flag in Supabase to make your user an admin:

```sql
update profiles set role='admin' where display_name='YOUR_EMAIL';
```

Lock admin routes behind a simple check (to be replaced by middleware):

```astro
---
// at top of /admin pages, pseudo‑guard until middleware is added
// if (profile.role !== 'admin') return Astro.redirect('/')
---
```

---

## 22) Launch Checklist Additions

* `/admin` shows open verification tasks and actions work
* `/[city]/calm-windows` builds at SSG and links from city page
* Docker dev boot: `docker compose up` serves site on :4321
* iCal feed responds with text/calendar and imports into Google Calendar

---

## 23) Admin Auth Middleware (MVP-safe)

Use simple **HTTP Basic Auth** for all `/admin` routes (swappable later for Supabase SSR). Add two env vars.

**.env.example** (append)

```ini
ADMIN_BASIC_USER="admin"
ADMIN_BASIC_PASS="change-me"
```

**/src/middleware.ts**

```ts
import type { MiddlewareHandler } from 'astro';

function unauthorized(realm = 'findABA.care Admin') {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${realm}", charset="UTF-8"` },
  });
}

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin')) {
    const hdr = request.headers.get('authorization');
    if (!hdr?.startsWith('Basic ')) return unauthorized();
    const [user, pass] = Buffer.from(hdr.slice(6), 'base64').toString('utf8').split(':');
    if (user !== process.env.ADMIN_BASIC_USER || pass !== process.env.ADMIN_BASIC_PASS) {
      return unauthorized();
    }
  }
  return next();
};
```

> Swap this later for Supabase SSR role checks; this is secure enough for a private MVP behind unique creds.

---

## 24) Styled Events List with RSVP Counts & Capacity Bar

### API: add counts

**/src/pages/api/events.ts** (replace file)

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city');
  if (!city) return new Response(JSON.stringify([]));
  const { data: c } = await supabase.from('cities').select('id').eq('slug', city).single();
  const { data: v } = await supabase.from('venues').select('id').eq('city_id', c?.id);
  const ids = v?.map((x: any) => x.id) || [];
  const { data: events } = await supabase.from('events').select('*, venues(name,address)').in('venue_id', ids).order('date');
  const evIds = (events || []).map((e: any) => e.id);
  const { data: rsvpCounts } = await supabase
    .from('rsvps')
    .select('event_id, count:event_id')
    .in('event_id', evIds)
    .group('event_id');
  const countsMap = Object.fromEntries((rsvpCounts || []).map((r: any) => [r.event_id, Number(r.count)]));
  const enriched = (events || []).map((e: any) => ({ ...e, rsvps_count: countsMap[e.id] || 0 }));
  return new Response(JSON.stringify(enriched), { headers: { 'Content-Type': 'application/json' } });
};
```

### Page UI

**/src/pages/events/[city].astro** (replace section)

```astro
---
import Base from '../../layouts/Base.astro';
import { supabase } from '../../lib/db';
import AuthIsland from '../../components/AuthIsland.tsx';
import RSVPButtonIsland from '../../components/RSVPButtonIsland.tsx';

const { city } = Astro.params;
const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', city).single();
const { data: v } = await supabase.from('venues').select('id').eq('city_id', cityRow?.id);
const ids = v?.map((x:any)=>x.id) || [];
const { data: events } = await supabase.from('events').select('*, venues(name,address,lat,lng)').in('venue_id', ids).order('date');
const { data: rsvpCounts } = await supabase.from('rsvps').select('event_id, count:event_id').in('event_id', (events||[]).map((e:any)=>e.id)).group('event_id');
const countsMap = Object.fromEntries((rsvpCounts||[]).map((r:any)=>[r.event_id, Number(r.count)]));
---
<Base title={`Events in ${cityRow?.name}`}>
  <div class="mb-4"><AuthIsland client:load /></div>
  <h1 class="text-xl font-semibold mb-4">This week's micro-groups</h1>
  <div class="space-y-3">
    {events?.map((e:any) => {
      const count = countsMap[e.id] || 0;
      const pct = Math.min(100, Math.round((count / (e.capacity||12)) * 100));
      return (
        <article class="p-4 border rounded-xl">
          <h3 class="font-semibold">{e.title}</h3>
          <p class="text-sm text-gray-700">{e.venues?.name} · {e.date} {e.start_time}-{e.end_time}</p>
          <div class="h-2 bg-gray-100 rounded mt-2">
            <div class="h-2 bg-black rounded" style={`width:${pct}%`}></div>
          </div>
          <p class="text-xs text-gray-600 mt-1">{count}/{e.capacity||12} spots filled</p>
          <div class="mt-2"><RSVPButtonIsland client:load eventId={e.id} /></div>
        </article>
      );
    })}
  </div>
</Base>
```

---

## 25) Seed Script: Auto‑fetch Venues → CSV (Google Places API)

This Node script pulls museums, libraries, parks, and playgrounds for a city center and writes a CSV compatible with the importer.

**.env.example** (append)

```ini
GOOGLE_MAPS_API_KEY="YOUR-GOOGLE-PLACES-API-KEY"
```

**/scripts/fetch_venues.ts**

```ts
/*
  Usage:
  pnpm tsx scripts/fetch_venues.ts "Dallas, TX" {{DALLAS_CITY_ID}}
  pnpm tsx scripts/fetch_venues.ts "Houston, TX" {{HOUSTON_CITY_ID}}
*/
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY missing');

const city = process.argv[2];
const cityId = process.argv[3];
if (!city || !cityId) throw new Error('Usage: tsx scripts/fetch_venues.ts "City, ST" CITY_UUID');

async function geocode(q: string) {
  const u = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  u.searchParams.set('address', q);
  u.searchParams.set('key', apiKey);
  const res = await fetch(u); const j: any = await res.json();
  const loc = j.results?.[0]?.geometry?.location; if (!loc) throw new Error('geocode failed');
  return { lat: loc.lat, lng: loc.lng };
}

async function nearby(lat: number, lng: number, keyword: string, type: string) {
  const u = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  u.searchParams.set('location', `${lat},${lng}`);
  u.searchParams.set('radius', '15000');
  if (type) u.searchParams.set('type', type);
  if (keyword) u.searchParams.set('keyword', keyword);
  u.searchParams.set('key', apiKey);
  const res = await fetch(u); return (await res.json()).results as any[];
}

(async () => {
  const { lat, lng } = await geocode(city);
  const buckets = [
    { keyword: '', type: 'museum' },
    { keyword: '', type: 'library' },
    { keyword: '', type: 'park' },
    { keyword: 'playground', type: 'park' },
  ];
  const all: any[] = [];
  for (const b of buckets) {
    const res = await nearby(lat, lng, b.keyword, b.type);
    all.push(...res);
  }
  // de-dupe by place_id
  const map = new Map<string, any>();
  for (const r of all) map.set(r.place_id, r);
  const rows = Array.from(map.values()).slice(0, 60).map(r => ({
    name: r.name?.replace(/,/g, ' '),
    address: r.vicinity?.replace(/,/g, ' '),
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    type: (r.types?.[0] || 'park'),
    city_id: cityId,
    quiet_room: 'false',
    hand_dryer: 'true',
    visual_supports: 'false',
  }));

  const out = ['name,address,lat,lng,type,city_id,quiet_room,hand_dryer,visual_supports',
    ...rows.map(r => Object.values(r).join(','))].join('
');
  const file = path.join('supabase/seed', `${city.toLowerCase().replace(/[^a-z]+/g,'-')}.auto.csv`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log('Wrote', file, 'rows:', rows.length);
})();
```

**package.json** (add script)

```json
{
  "scripts": {
    "seed:fetch:dallas": "tsx scripts/fetch_venues.ts 'Dallas, TX' {{DALLAS_CITY_ID}}",
    "seed:fetch:houston": "tsx scripts/fetch_venues.ts 'Houston, TX' {{HOUSTON_CITY_ID}}"
  },
  "devDependencies": {
    "tsx": "^4.19.1"
  }
}
```

> Import the generated CSV with the existing `/api/admin/import-venues` endpoint.

---

## 26) Notes on Production Hardening

* Replace Basic Auth with Supabase SSR middleware and `profiles.role = 'admin'`.
* Rate-limit `/api/admin/*` and `/api/report` endpoints.
* Add upload moderation for venue photos.
* Switch “Go Now” meter to materialized view refreshed by a cron.
# 25) Seed Script: Auto‑fetch Venues → CSV (Google Places API)

This Node script pulls museums, libraries, parks, and playgrounds near a city center and writes a CSV compatible with the bulk importer.

**.env.example (append):**

```ini
GOOGLE_MAPS_API_KEY="YOUR-GOOGLE-PLACES-API-KEY"
```

**/scripts/fetch_venues.ts**

```ts
/*
  Usage:
  pnpm tsx scripts/fetch_venues.ts "Dallas, TX" {{DALLAS_CITY_ID}}
  pnpm tsx scripts/fetch_venues.ts "Houston, TX" {{HOUSTON_CITY_ID}}
*/
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY missing');

const city = process.argv[2];
const cityId = process.argv[3];
if (!city || !cityId) throw new Error('Usage: tsx scripts/fetch_venues.ts "City, ST" CITY_UUID');

async function geocode(q: string) {
  const u = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  u.searchParams.set('address', q);
  u.searchParams.set('key', apiKey);
  const res = await fetch(u); const j: any = await res.json();
  const loc = j.results?.[0]?.geometry?.location; if (!loc) throw new Error('geocode failed');
  return { lat: loc.lat, lng: loc.lng };
}

async function nearby(lat: number, lng: number, keyword: string, type: string) {
  const u = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  u.searchParams.set('location', `${lat},${lng}`);
  u.searchParams.set('radius', '15000');
  if (type) u.searchParams.set('type', type);
  if (keyword) u.searchParams.set('keyword', keyword);
  u.searchParams.set('key', apiKey);
  const res = await fetch(u); return (await res.json()).results as any[];
}

(async () => {
  const { lat, lng } = await geocode(city);
  const buckets = [
    { keyword: '', type: 'museum' },
    { keyword: '', type: 'library' },
    { keyword: '', type: 'park' },
    { keyword: 'playground', type: 'park' },
  ];
  const all: any[] = [];
  for (const b of buckets) {
    const res = await nearby(lat, lng, b.keyword, b.type);
    all.push(...res);
  }
  // de‑dupe by place_id
  const map = new Map<string, any>();
  for (const r of all) map.set(r.place_id, r);
  const rows = Array.from(map.values()).slice(0, 60).map(r => ({
    name: r.name?.replace(/,/g, ' '),
    address: r.vicinity?.replace(/,/g, ' '),
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    type: (r.types?.[0] || 'park'),
    city_id: cityId,
    quiet_room: 'false',
    hand_dryer: 'true',
    visual_supports: 'false',
  }));

  const out = ['name,address,lat,lng,type,city_id,quiet_room,hand_dryer,visual_supports',
    ...rows.map(r => Object.values(r).join(','))].join('\n');
  const file = path.join('supabase/seed', `${city.toLowerCase().replace(/[^a-z]+/g,'-')}.auto.csv`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log('Wrote', file, 'rows:', rows.length);
})();
```

**package.json (add):**

```json
{
  "scripts": {
    "seed:fetch:dallas": "tsx scripts/fetch_venues.ts 'Dallas, TX' {{DALLAS_CITY_ID}}",
    "seed:fetch:houston": "tsx scripts/fetch_venues.ts 'Houston, TX' {{HOUSTON_CITY_ID}}"
  },
  "devDependencies": {
    "tsx": "^4.19.1"
  }
}
```

**Import the generated CSV with the existing importer:**

```bash
curl -X POST --data-binary @supabase/seed/dallas-tx.auto.csv \
  http://localhost:4321/api/admin/import-venues
```

> **Note:** Google Places TOS may require displaying attribution. Add "Powered by Google" on pages seeded from this script.

---

# 26) Production‑hardening Notes

* Replace Basic Auth with Supabase SSR role checks; guard `/admin/*` and write an auth middleware.
* Add rate limiting (e.g., ip‑based) for `/api/admin/*`, `/api/report`, and RSVP/Reviews.
* Move “Go Now” meter to a materialized view refreshed by a cron; store per‑venue per‑hour occupancy heuristics.
* Photo moderation for venue uploads; strip EXIF; require alt text.
* Logging and alerting: ship server logs to a sink (e.g., Logtail), add error budgets.
* Privacy: keep no child names/photos; provide data export/delete endpoints.

---

## 27) Cron: Refresh “Go Now” Meter (Nightly + Quarter‑Hourly)

We’ll compute a per‑venue hourly occupancy heuristic into a cache table/materialized view and expose a cron endpoint so Vercel (or Supabase scheduled tasks) can hit it.

### DB: cache table

```sql
create table if not exists public.gonow_cache (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  updated_at timestamptz not null default now(),
  meter text not null -- Quiet | Moderate | Busy
);
```

### Serverless cron endpoint

**/src/pages/api/cron/refresh-go-now.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';
import { goNow } from '../../../lib/goNow';

export const GET: APIRoute = async ({ request }) => {
  // Optional: simple header token guard
  const token = request.headers.get('x-cron-token');
  if (process.env.CRON_TOKEN && token !== process.env.CRON_TOKEN) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }
  const { data: venues } = await supabase.from('venues').select('id,type');
  if (!venues) return new Response(JSON.stringify({ ok: true, count: 0 }));
  const rows = venues.map((v:any) => ({ venue_id: v.id, meter: goNow(v.type, new Date()), updated_at: new Date().toISOString() }));
  // upsert cache
  const { error } = await supabase.from('gonow_cache').upsert(rows);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true, count: rows.length }));
};
```

### Vercel cron (quarter‑hourly + nightly)

**vercel.json**

```json
{
  "crons": [
    { "path": "/api/cron/refresh-go-now", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/refresh-go-now", "schedule": "0 3 * * *" }
  ]
}
```

**.env.example (append)**

```ini
CRON_TOKEN="set-a-random-string"
```

Update your API route fetches (optional) to read `gonow_cache.meter` instead of calling `goNow` on the fly for faster page loads.

---

## 28) Rate Limiting (Upstash Redis)

Protect `/api/admin/*`, `/api/report`, `/api/rsvps`, and `/api/reviews` with a lightweight token bucket.

**.env.example (append):**

```ini
UPSTASH_REDIS_REST_URL="https://us1-elegant-foo.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxx"
```

**/src/lib/rateLimit.ts**

```ts
export async function rateLimit(key: string, limit = 60, windowSec = 60) {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const now = Math.floor(Date.now() / 1000);
  const bucketKey = `rl:${key}:${Math.floor(now / windowSec)}`;
  const res = await fetch(`${url}/incr/${bucketKey}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const count = Number(await res.text());
  if (count === 1) {
    await fetch(`${url}/pexpire/${bucketKey}/` + (windowSec * 1000), { headers: { Authorization: `Bearer ${token}` } });
  }
  return count <= limit;
}
```

Wrap endpoints, e.g. **/src/pages/api/report.ts**:

```ts
import type { APIRoute } from 'astro';
import { rateLimit } from '../../lib/rateLimit';

export const POST: APIRoute = async ({ request }) => {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'ip:unknown';
  const ok = await rateLimit(`report:${ip}`, 10, 60);
  if (!ok) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  const body = await request.json();
  console.log('REPORT', body);
  return new Response(JSON.stringify({ ok: true }));
};
```

Do similarly for `/api/admin/*` (stricter limits) and RSVP/Reviews.

---

## 29) Supabase SSR Role‑based Guard (replace Basic Auth)

Use Supabase SSR server client to check session and role on server for `/admin/*` pages.

### Install

```bash
pnpm add @supabase/ssr
```

### Server client

**/src/lib/supabaseServer.ts**

```ts
import { createServerClient } from '@supabase/ssr';
export function getServerClient(request: Request) {
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => {
          const cookie = request.headers.get('cookie') || '';
          const m = cookie.match(new RegExp(`${key}=([^;]+)`));
          return m ? m[1] : undefined;
        },
        set: () => {},
        remove: () => {},
      },
    }
  );
  return supabase;
}
```

### Middleware

**/src/middleware.ts** (replace Basic Auth block)

```ts
import type { MiddlewareHandler } from 'astro';
import { getServerClient } from './lib/supabaseServer';

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin')) {
    const supabase = getServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(null, { status: 302, headers: { Location: '/' } });
    const { data: profile } = await supabase.from('profiles').select('role').eq('auth_user', user.id).single();
    if (profile?.role !== 'admin') return new Response(null, { status: 302, headers: { Location: '/' } });
  }
  return next();
};
```

> Ensure your admin account exists in `profiles` with `role='admin'` and that Supabase Auth is active so SSR can read cookies.

---

### Recap

* Nightly & 15‑min **cron** refreshes `gonow_cache`.
* **Rate limiting** protects sensitive endpoints.
* **SSR role guard** secures `/admin/*` using Supabase profiles.

This replaces the temporary Basic Auth and hardens the MVP for a city pilot.

---

## 30) Read from `gonow_cache` (faster pages)

### API: venues returns cached meter

**/src/pages/api/venues.ts** (replace file)

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city');
  let base = supabase.from('venues').select('*, gonow_cache(meter)').order('name');
  if (city) {
    const { data: c } = await supabase.from('cities').select('id').eq('slug', city).single();
    if (c?.id) base = base.eq('city_id', c.id);
  }
  const { data, error } = await base;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  // flatten meter
  const rows = (data || []).map((v: any) => ({ ...v, meter: v.gonow_cache?.meter || null, gonow_cache: undefined }));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
};
```

### UI: VenueCard prefers cached meter

**/src/components/VenueCard.astro** (change top script)

```astro
---
const { venue } = Astro.props as { venue: any };
import { goNow } from '../lib/goNow';
const meter = venue.meter || goNow(venue.type);
---
```

### City page: fetch via API (ensures meter included)

**/src/pages/[city]/index.astro** (replace venues query)

```astro
---
const res = await fetch(`${Astro.site ? Astro.site.origin : ''}/api/venues?city=${city}`);
const venues = await res.json();
---
```

> This keeps the SSR fast and consistent with cron-cached meters.

---

## 31) Google Calendar “Subscribe” buttons for city iCal

Add subscribe links to each city events page and calm-windows page.

**/src/pages/events/[city].astro** (under `<h1>`)

```astro
<p class="text-sm mb-3">
  <a class="text-blue-600" href={`/${city}/calendar.ics`}>Subscribe via iCal →</a>
</p>
```

**/src/pages/[city]/calm-windows.astro** (under title)

```astro
<p class="text-sm mb-3">
  <a class="text-blue-600" href={`/${city}/calendar.ics`}>Subscribe via iCal →</a>
</p>
```

> Tip: For Google Calendar, users can paste the .ics URL under “Other calendars → From URL”.

---

## 32) One‑click seed: 50 venues + 4 weekly micro‑events

This script will:

1. Ensure two cities exist (Dallas, Houston)
2. Import or fetch ~50 venues per city (using CSV if present, else Google Places)
3. Create 4 weekly micro‑events (2 per city) for the next 2 weeks

**/scripts/seed_one_click.ts**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.LOCAL_API_ORIGIN || 'http://localhost:4321';

async function supabaseSQL(sql: string) {
  const res = await fetch(`${API}/api/health`); // smoke check
  if (!res.ok) throw new Error('API not reachable');
  // For MVP: ask user to run SQL in Supabase UI; or wire a service endpoint if available.
}

async function postCSV(file: string) {
  const buf = fs.readFileSync(file);
  const res = await fetch(`${API}/api/admin/import-venues`, { method: 'POST', body: buf });
  if (!res.ok) throw new Error('Import failed: ' + await res.text());
}

async function run() {
  console.log('Seeding cities…');
  // Output SQL for manual run (safer than exposing service role in code)
  const sql = `insert into cities (name,state,slug) values ('Dallas','TX','dallas') on conflict do nothing;
`
            + `insert into cities (name,state,slug) values ('Houston','TX','houston') on conflict do nothing;`;
  console.log('
Run this in Supabase SQL editor:
', sql, '
');

  const seedDir = path.join('supabase','seed');
  const dallas = path.join(seedDir, 'dallas-tx.auto.csv');
  const houston = path.join(seedDir, 'houston-tx.auto.csv');

  if (fs.existsSync(dallas)) { console.log('Importing Dallas CSV…'); await postCSV(dallas); }
  if (fs.existsSync(houston)) { console.log('Importing Houston CSV…'); await postCSV(houston); }

  console.log('Creating starter events…');
  // naive: call events insert via a temp endpoint or advise SQL (safer for MVP)
  const eventsSQL = `
  insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
  select v.id, 'LEGO Micro‑Group (30 min)', 'Structured build time for ages 5–8', current_date + 3, '10:00','10:30', 8, true
  from venues v join cities c on v.city_id=c.id where c.slug='dallas' limit 1;
  insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
  select v.id, 'Quiet Hour Park Meetup', 'Short sensory‑friendly park hang', current_date + 4, '09:00','09:45', 12, true
  from venues v join cities c on v.city_id=c.id where c.slug='dallas' limit 1 offset 1;
  insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
  select v.id, 'LEGO Micro‑Group (30 min)', 'Structured build time for ages 5–8', current_date + 3, '10:00','10:30', 8, true
  from venues v join cities c on v.city_id=c.id where c.slug='houston' limit 1;
  insert into events (venue_id, title, description, date, start_time, end_time, capacity, approved)
  select v.id, 'Quiet Hour Park Meetup', 'Short sensory‑friendly park hang', current_date + 4, '09:00','09:45', 12, true
  from venues v join cities c on v.city_id=c.id where c.slug='houston' limit 1 offset 1;`;

  console.log('
Run this in Supabase SQL editor to add 4 events:
', eventsSQL, '
');

  console.log('Done. Visit /dallas and /houston to verify.');
}

run().catch(e => { console.error(e); process.exit(1); });
```

**package.json (add):**

```json
{
  "scripts": {
    "seed:one": "tsx scripts/seed_one_click.ts"
  }
}
```

> For production, replace the SQL printouts with secured service‑role API endpoints, or run seeds via Supabase Migrations.

---

## 33) Admin UI: Inline Venue Amenity Editing

Create a simple admin page to edit venue amenities inline with optimistic updates.

**/src/pages/admin/venue/[id].astro**

```astro
---
import Base from '../../../layouts/Base.astro';
import { supabase } from '../../../lib/db';
const { id } = Astro.params;
const { data: venue } = await supabase.from('venues').select('*').eq('id', id).single();
---
<Base title={`Admin · Edit ${venue?.name}`}>
  <h1 class="text-xl font-semibold mb-4">Edit Amenities · {venue?.name}</h1>
  <form method="post" action={`/api/admin/venue-update?id=${venue.id}`} class="space-y-4 p-4 border rounded-xl">
    <div class="grid sm:grid-cols-2 gap-4">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="quiet_room" {venue?.amenities?.quiet_room && 'checked'} /> Quiet room
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visual_supports" {venue?.amenities?.visual_supports && 'checked'} /> Visual supports
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="hand_dryer" {venue?.amenities?.hand_dryer && 'checked'} /> Hand dryers present
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="lighting_control" {venue?.amenities?.lighting_control && 'checked'} /> Lighting control
      </label>
    </div>
    <div>
      <label class="block text-sm mb-1">What to expect</label>
      <textarea name="what_to_expect" class="w-full border rounded p-2" rows="5">{venue?.what_to_expect}</textarea>
    </div>
    <div>
      <label class="block text-sm mb-1">Staff contact (internal)</label>
      <input name="staff_contact" class="w-full border rounded p-2" value={venue?.staff_contact || ''} />
    </div>
    <button class="px-4 py-2 rounded bg-black text-white">Save</button>
  </form>
</Base>
```

**/src/pages/api/admin/venue-update.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';
import { rateLimit } from '../../../lib/rateLimit';

export const POST: APIRoute = async ({ request, url }) => {
  const ok = await rateLimit('admin:update', 100, 60);
  if (!ok) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });

  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400 });
  const form = await request.formData();
  const amenities = {
    quiet_room: form.get('quiet_room') === 'on',
    visual_supports: form.get('visual_supports') === 'on',
    hand_dryer: form.get('hand_dryer') === 'on',
    lighting_control: form.get('lighting_control') === 'on',
  };
  const what_to_expect = String(form.get('what_to_expect') || '');
  const staff_contact = String(form.get('staff_contact') || '');
  const { error } = await supabase.from('venues').update({ amenities, what_to_expect, staff_contact, last_verified: new Date().toISOString() }).eq('id', id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(null, { status: 302, headers: { Location: `/admin/venue/${id}` } });
};
```

Add a link from the queue item on `/admin` to this edit page:

```astro
<a class="text-sm text-blue-600" href={`/admin/venue/${t.venue_id}`}>Edit →</a>
```

---

## 34) Parent Feedback Digest Email for Venues (Weekly)

Send venues a weekly summary of reviews and tips. Uses existing `sendEmail` helper and Vercel Cron.

**DB: venue email field** (optional)

```sql
alter table public.venues add column if not exists contact_email text;
```

**/src/pages/api/cron/venue-digest.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';
import { sendEmail } from '../../../lib/email';

function tpl(name: string, items: any[]) {
  const rows = items.map(i => `<li><b>${i.created_at?.slice(0,10)}</b> — Predictability ${i.predictability}/5, Would return: ${i.would_return ? 'Yes' : 'No'}<br/>Tip: ${i.tips ? i.tips : '—'}</li>`).join('');
  return `<h2>${name}: Parent Feedback (Weekly)</h2><ul>${rows || '<li>No new feedback</li>'}</ul>`;
}

export const GET: APIRoute = async ({ request }) => {
  const token = request.headers.get('x-cron-token');
  if (process.env.CRON_TOKEN && token !== process.env.CRON_TOKEN) return new Response('forbidden', { status: 403 });

  const { data: venues } = await supabase.from('venues').select('id,name,contact_email').neq('contact_email', null);
  if (!venues) return new Response(JSON.stringify({ ok: true, count: 0 }));

  let sent = 0;
  for (const v of venues) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('predictability,would_return,tips,created_at')
      .eq('venue_id', v.id)
      .gte('created_at', new Date(Date.now() - 7*24*3600*1000).toISOString())
      .order('created_at', { ascending: false });
    if (!reviews) continue;
    const html = tpl(v.name, reviews);
    await sendEmail(v.contact_email!, `Parent Feedback Digest · ${v.name}`, html);
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }));
};
```

**vercel.json** (append cron)

```json
{
  "crons": [
    { "path": "/api/cron/venue-digest", "schedule": "0 13 * * MON" }
  ]
}
```

---

## 35) Report → Auto‑create Verification Task

Wire the existing **/api/report** to open a `verifications` task mapped to the venue, so ops can confirm/correct quickly.

**/src/pages/api/report.ts** (replace file)

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/db';
import { rateLimit } from '../../lib/rateLimit';

export const POST: APIRoute = async ({ request }) => {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'ip:unknown';
  const ok = await rateLimit(`report:${ip}`, 10, 60);
  if (!ok) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });

  const body = await request.json();
  const { venue_id, type = 'mismatch', notes = '' } = body || {};
  if (!venue_id) return new Response(JSON.stringify({ error: 'venue_id required' }), { status: 400 });

  await supabase.from('verifications').insert({ venue_id, status: 'open', notes: `[${type}] ${notes}` });
  return new Response(JSON.stringify({ ok: true }));
};
```

**UI:** Add a simple report button on `venue/[slug].astro` that posts `{ venue_id }`.

```astro
<form method="post" action="/api/report" class="mt-4">
  <input type="hidden" name="venue_id" value={venue.id} />
  <!-- For simplicity, switch to JS fetch later; this is server post example -->
  <button class="text-sm text-red-600 border px-3 py-1 rounded">Report mismatch</button>
</form>
```

> If you keep it as a form POST, convert the API to parse `FormData`. JS `fetch` with JSON is fine too.

---

## 36) Inline “Suggest Correction” Form

Add a lightweight inline form on venue pages so parents can quickly submit factual corrections (without reload).

**/src/components/SuggestCorrection.astro**

```astro
---
import { useState } from 'react';
const { venue } = Astro.props;
const [submitted, setSubmitted] = useState(false);
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    venue_id: venue.id,
    type: 'suggestion',
    notes: form.notes.value,
  };
  const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (res.ok) setSubmitted(true);
}
---
{submitted ? (
  <p class="text-green-600 text-sm">Thanks — we’ll verify and update soon.</p>
) : (
  <form onSubmit={handleSubmit} class="border p-3 rounded-md mt-4 text-sm">
    <label class="block mb-2">See something outdated? Let us know:</label>
    <textarea name="notes" required class="w-full border rounded p-2 mb-2" rows="3"></textarea>
    <button class="bg-blue-600 text-white px-3 py-1 rounded">Send</button>
  </form>
)}
```

Add to **/src/pages/venue/[slug].astro**:

```astro
<SuggestCorrection venue={venue} />
```

This feeds into the existing `/api/report` → `verifications` task flow.

---

## 37) Admin CSV Export

Allow admins to download CSVs of venues, events, or reviews.

**/src/pages/api/admin/export.ts**

```ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const type = url.searchParams.get('type') || 'venues';
  const tables = ['venues', 'events', 'reviews'];
  if (!tables.includes(type)) return new Response('invalid type', { status: 400 });
  const { data, error } = await supabase.from(type).select('*');
  if (error) return new Response(error.message, { status: 500 });
  const rows = data || [];
  const headers = Object.keys(rows[0] || {}).join(',');
  const csv = [headers, ...rows.map(r => Object.values(r).map(v => String(v).replace(/,/g, ' ')).join(','))].join('
');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=${type}.csv` } });
};
```

Add buttons in **/src/pages/admin/index.astro**:

```astro
<div class="flex gap-3 text-sm">
  <a href="/api/admin/export?type=venues" class="border px-3 py-1 rounded">Export Venues CSV</a>
  <a href="/api/admin/export?type=events" class="border px-3 py-1 rounded">Export Events CSV</a>
  <a href="/api/admin/export?type=reviews" class="border px-3 py-1 rounded">Export Reviews CSV</a>
</div>
```

---

## 38) City Launch Checklist (Press + SEO)

A structured checklist for the launch of a new metro rollout (e.g., Austin, Phoenix, Orlando).

### Pre‑Launch (T‑4 weeks)

* ✅ Verify ≥50 venues, 10 events, 10 reviews per city.
* ✅ Collect 2–3 parent testimonials for press kit.
* ✅ Confirm at least one local sensory partner (museum, gym).
* ✅ Create `presskit.zip` (logos, one‑pager PDF, screenshots).

### Launch Week

* **Press:**

  * Pitch to local family & parenting media.
  * Issue PRNewswire or EIN press release titled “findABA.care Launches Autism‑Friendly City Guide for [City] Families.”
  * Feature 1 parent story (quote + image).
* **SEO:**

  * Publish `/[city]-autism-friendly-guide` optimized for “autism friendly [city]”.
  * Internal links from blog, `/find-aba-care`, and `/about-us`.
  * Add schema markup: `LocalBusiness`, `Event`, `FAQPage`.
* **Community:**

  * Email newsletter segment for the city (Top 5 Calm Places This Week).
  * Social post schedule: teaser → launch → testimonial → review highlight.

### Post‑Launch (T+2 weeks)

* Pull traffic + conversion KPIs.
* Invite local ABA providers to claim profiles.
* Publish “Access Report [City] Q1” summarizing waitlists, insurances, and community feedback.

> This checklist ensures every new city rollout aligns brand, SEO, PR, and trust signals for rapid credibility.
