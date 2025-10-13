-- Add Profile Completion Fields
-- First name, last name, avatar URL for user profiles

-- Add new columns to profiles table
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_url text,
  add column if not exists profile_completed boolean default false;

-- Create index for looking up incomplete profiles
create index if not exists idx_profiles_completed on public.profiles(profile_completed);

-- Comments
comment on column public.profiles.first_name is 'User first name';
comment on column public.profiles.last_name is 'User last name';
comment on column public.profiles.avatar_url is 'URL to user avatar image in Supabase Storage';
comment on column public.profiles.profile_completed is 'Whether user has completed onboarding';

-- Create storage bucket for profile avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
