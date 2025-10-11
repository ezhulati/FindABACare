-- FindABACare Database Schema
-- Initial migration

create extension if not exists "uuid-ossp";

-- Cities Table
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null,
  center_lat double precision,
  center_lng double precision,
  status text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

-- Profiles Table (parent/venue/admin roles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  role text check (role in ('parent','venue','admin')) default 'parent',
  display_name text,
  email text,
  city_id uuid references public.cities(id),
  child_age_band text,
  interests text[],
  communication text[],
  sensory_flags jsonb,
  privacy jsonb default '{"show_to_event_peers_only": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Venues Table
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete cascade,
  name text not null,
  slug text unique,
  address text,
  lat double precision,
  lng double precision,
  type text,
  description text,
  sensory_hours jsonb,
  amenities jsonb,
  triggers jsonb,
  what_to_expect text,
  staff_contact text,
  last_verified timestamptz,
  verified_by uuid references public.profiles(id),
  photo_keys text[],
  meter text check (meter in ('Quiet','Moderate','Busy')),
  status text default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events Table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 12 check (capacity > 0),
  age_range text,
  tags text[],
  host_profile_id uuid references public.profiles(id),
  status text default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RSVPs Table
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  status text default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, profile_id)
);

-- Reviews Table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  predictability int check (predictability between 1 and 5),
  sensory_level int check (sensory_level between 1 and 5),
  staff_knowledge int check (staff_knowledge between 1 and 5),
  content text,
  best_time text,
  triggers text[],
  status text default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Incidents/Reports Table
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  incident_type text not null,
  description text not null,
  severity text check (severity in ('low','medium','high')),
  status text default 'open' check (status in ('open','investigating','resolved','dismissed')),
  admin_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Verifications Table
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  status text default 'open' check (status in ('open','in_progress','completed','rejected')),
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Go Now Cache Table
create table if not exists public.gonow_cache (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  updated_at timestamptz not null default now(),
  meter text not null check (meter in ('Quiet','Moderate','Busy'))
);

-- Indexes
create index if not exists idx_cities_slug on public.cities(slug);
create index if not exists idx_venues_city_id on public.venues(city_id);
create index if not exists idx_venues_status on public.venues(status);
create index if not exists idx_venues_slug on public.venues(slug);
create index if not exists idx_venues_last_verified on public.venues(last_verified);
create index if not exists idx_events_venue_id on public.events(venue_id);
create index if not exists idx_events_city_id on public.events(city_id);
create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_rsvps_event_id on public.rsvps(event_id);
create index if not exists idx_rsvps_profile_id on public.rsvps(profile_id);
create index if not exists idx_reviews_venue_id on public.reviews(venue_id);
create index if not exists idx_reviews_status on public.reviews(status);

-- RLS
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.reviews enable row level security;
alter table public.incidents enable row level security;

create policy "cities_read_all" on public.cities for select using (true);
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "venues_read_all" on public.venues for select using (status = 'active');
create policy "venues_insert_admin" on public.venues for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "events_read_published" on public.events for select using (status = 'published');
create policy "events_insert_admin" on public.events for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'venue')));
create policy "rsvps_read_all" on public.rsvps for select using (true);
create policy "rsvps_insert_own" on public.rsvps for insert with check (auth.uid() = profile_id);
create policy "rsvps_update_own" on public.rsvps for update using (auth.uid() = profile_id);
create policy "rsvps_delete_own" on public.rsvps for delete using (auth.uid() = profile_id);
create policy "reviews_read_published" on public.reviews for select using (status = 'published');
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = profile_id);
create policy "incidents_read_own" on public.incidents for select using (auth.uid() = profile_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "incidents_insert_authenticated" on public.incidents for insert with check (auth.uid() = profile_id);

-- Functions
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles for each row execute function update_updated_at_column();
create trigger update_venues_updated_at before update on public.venues for each row execute function update_updated_at_column();
create trigger update_events_updated_at before update on public.events for each row execute function update_updated_at_column();
create trigger update_rsvps_updated_at before update on public.rsvps for each row execute function update_updated_at_column();
create trigger update_reviews_updated_at before update on public.reviews for each row execute function update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'parent');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed data
insert into public.cities (name, state, slug, center_lat, center_lng, status)
values
  ('Dallas', 'TX', 'dallas', 32.7767, -96.7970, 'active'),
  ('Houston', 'TX', 'houston', 29.7604, -95.3698, 'active')
on conflict (slug) do nothing;
