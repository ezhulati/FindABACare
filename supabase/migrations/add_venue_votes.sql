-- Add Venue Voting System
-- Simple up/down vote for venues (like Reddit/Hacker News)
-- Users must be logged in to vote

create table if not exists public.venue_votes (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(venue_id, profile_id) -- One vote per user per venue
);

-- Index for fast lookup
create index if not exists idx_venue_votes_venue_id on public.venue_votes(venue_id);
create index if not exists idx_venue_votes_profile_id on public.venue_votes(profile_id);

-- Add vote counts to venues table for performance (denormalized)
alter table public.venues
  add column if not exists upvotes int default 0,
  add column if not exists downvotes int default 0,
  add column if not exists vote_score int default 0; -- upvotes - downvotes

-- Function to update venue vote counts
create or replace function update_venue_vote_counts()
returns trigger as $$
declare
  up_count int;
  down_count int;
begin
  -- Count votes for this venue
  select
    coalesce(sum(case when vote_type = 'up' then 1 else 0 end), 0),
    coalesce(sum(case when vote_type = 'down' then 1 else 0 end), 0)
  into up_count, down_count
  from public.venue_votes
  where venue_id = coalesce(new.venue_id, old.venue_id);

  -- Update venue counts
  update public.venues
  set
    upvotes = up_count,
    downvotes = down_count,
    vote_score = up_count - down_count
  where id = coalesce(new.venue_id, old.venue_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Triggers to update counts
create trigger update_venue_votes_on_insert
  after insert on public.venue_votes
  for each row execute function update_venue_vote_counts();

create trigger update_venue_votes_on_update
  after update on public.venue_votes
  for each row execute function update_venue_vote_counts();

create trigger update_venue_votes_on_delete
  after delete on public.venue_votes
  for each row execute function update_venue_vote_counts();

-- Trigger for updated_at
create trigger update_venue_votes_updated_at
  before update on public.venue_votes
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table public.venue_votes enable row level security;

-- RLS Policies for venue_votes
create policy "venue_votes_read_all"
  on public.venue_votes for select using (true);

create policy "venue_votes_insert_own"
  on public.venue_votes for insert
  with check (auth.uid() = profile_id);

create policy "venue_votes_update_own"
  on public.venue_votes for update
  using (auth.uid() = profile_id);

create policy "venue_votes_delete_own"
  on public.venue_votes for delete
  using (auth.uid() = profile_id);

-- Comments
comment on table public.venue_votes is 'User up/down votes for venues';
comment on column public.venues.upvotes is 'Cached count of upvotes';
comment on column public.venues.downvotes is 'Cached count of downvotes';
comment on column public.venues.vote_score is 'Net vote score (upvotes - downvotes)';
