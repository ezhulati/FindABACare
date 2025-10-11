-- FindABACare Database Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Cities Table
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Profiles Table (parent/venue/admin roles)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user uuid unique,
  role text check (role in ('parent','venue','admin')) not null,
  display_name text,
  city_id uuid references public.cities(id),
  child_age_band text,
  interests text[],
  communication text[],
  sensory_flags jsonb,
  privacy jsonb default '{"show_to_event_peers_only": true}'::jsonb,
  created_at timestamptz default now()
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
  type text, -- museum, park, library, restaurant, theater, gym
  sensory_hours jsonb, -- [{day:"Sat", start:"09:00", end:"11:00"}]
  amenities jsonb, -- {quiet_room:true, lighting_control:true, hand_dryer:false, visual_supports:true}
  triggers jsonb, -- {strong_scents:false, loud_music:false, open_water:false}
  what_to_expect text,
  staff_contact text,
  last_verified timestamptz,
  verified_by uuid references public.profiles(id),
  photo_keys text[],
  status text default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events Table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 12 check (capacity > 0),
  host_profile_id uuid references public.profiles(id),
  visibility text default 'public' check (visibility in ('public','private')),
  approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RSVPs Table
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  status text default 'going' check (status in ('going','maybe','cancelled')),
  created_at timestamptz default now(),
  unique(event_id, profile_id)
);

-- Reviews Table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  predictability int check (predictability between 1 and 5),
  staff_helpfulness int check (staff_helpfulness between 1 and 5),
  clarity_of_signage int check (clarity_of_signage between 1 and 5),
  would_return boolean,
  tips text,
  verified_visit boolean default false,
  created_at timestamptz default now()
);

-- Verifications Table (Admin queue)
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  status text default 'open' check (status in ('open','in_progress','completed','rejected')),
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Go Now Cache Table (for performance)
create table if not exists public.gonow_cache (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  updated_at timestamptz not null default now(),
  meter text not null check (meter in ('Quiet','Moderate','Busy'))
);

-- Indexes for performance
create index if not exists idx_venues_city_id on public.venues(city_id);
create index if not exists idx_venues_status on public.venues(status);
create index if not exists idx_venues_last_verified on public.venues(last_verified);
create index if not exists idx_events_venue_id on public.events(venue_id);
create index if not exists idx_events_date on public.events(date);
create index if not exists idx_rsvps_event_id on public.rsvps(event_id);
create index if not exists idx_rsvps_profile_id on public.rsvps(profile_id);
create index if not exists idx_reviews_venue_id on public.reviews(venue_id);
create index if not exists idx_profiles_auth_user on public.profiles(auth_user);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.rsvps enable row level security;
alter table public.reviews enable row level security;

-- Basic RLS Policies
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = auth_user);

create policy "rsvps_read_all" on public.rsvps for select using (true);
create policy "rsvps_insert_own" on public.rsvps for insert with check (auth.uid() = (select auth_user from profiles where id = profile_id));
create policy "rsvps_delete_own" on public.rsvps for delete using (auth.uid() = (select auth_user from profiles where id = profile_id));

create policy "reviews_read_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = (select auth_user from profiles where id = profile_id));

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_venues_updated_at before update on public.venues
  for each row execute function update_updated_at_column();

create trigger update_events_updated_at before update on public.events
  for each row execute function update_updated_at_column();

-- Comments for documentation
comment on table public.cities is 'Cities where FindABACare operates';
comment on table public.profiles is 'User profiles (parents, venue managers, admins)';
comment on table public.venues is 'Sensory-friendly venues';
comment on table public.events is 'Micro-events and meetups';
comment on table public.rsvps is 'Event RSVPs';
comment on table public.reviews is 'Venue reviews from parents';
comment on table public.verifications is 'Admin verification queue for venues';
comment on table public.gonow_cache is 'Cached "Go Now" meter readings for performance';
