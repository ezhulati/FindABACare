-- Seed data for FindABACare MVP
-- Run this after schema.sql

-- Insert cities with coordinates
insert into public.cities (name, state, slug, center_lat, center_lng, status)
values
  ('Dallas', 'TX', 'dallas', 32.7767, -96.7970, 'active'),
  ('Houston', 'TX', 'houston', 29.7604, -95.3698, 'active')
on conflict (slug) do nothing;
