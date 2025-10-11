-- Add state column to cities table for better URL structure and SEO
-- Migration: 20251010000001_add_state_to_cities.sql

-- Add state column
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS state TEXT;

-- Set default value for existing rows (Texas)
UPDATE public.cities
SET state = 'TX'
WHERE state IS NULL;

-- Make it required for new rows
ALTER TABLE public.cities
ALTER COLUMN state SET NOT NULL;

-- Add check constraint for valid US state codes
ALTER TABLE public.cities
ADD CONSTRAINT valid_state_code
CHECK (state IN ('TX', 'CA', 'NY', 'FL', 'IL', 'PA', 'AZ', 'GA', 'NC', 'MI', 'OH', 'WA', 'CO', 'OR', 'MA', 'VA', 'TN', 'IN', 'MD', 'WI'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cities_state
ON public.cities(state);

-- Verify the update
SELECT id, name, slug, state, status FROM public.cities ORDER BY state, name;
