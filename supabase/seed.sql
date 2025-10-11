-- Seed data for FindABACare MVP
-- Run this after schema.sql

-- Insert cities
insert into public.cities (name, state, slug) values
  ('Dallas', 'TX', 'dallas'),
  ('Houston', 'TX', 'houston')
on conflict (slug) do nothing;

-- Note: Get city IDs for next steps
-- select id, slug from public.cities;
