-- Add contact information and pricing to venues table
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS price_level INTEGER CHECK (price_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS formatted_phone_number TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_phone ON venues(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venues_website ON venues(website) WHERE website IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venues_price_level ON venues(price_level) WHERE price_level IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN venues.phone IS 'Phone number in E.164 format (e.g., +14155552671)';
COMMENT ON COLUMN venues.formatted_phone_number IS 'Human-readable phone number (e.g., (415) 555-2671)';
COMMENT ON COLUMN venues.website IS 'Venue website URL';
COMMENT ON COLUMN venues.price_level IS 'Google Places price level: 0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive';
