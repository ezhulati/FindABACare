-- Add columns for national coverage and Google Places integration
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'google_places', 'user_submitted')),
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'community_verified', 'admin_verified')),
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS google_review_count INTEGER,
  ADD COLUMN IF NOT EXISTS is_open_now BOOLEAN,
  ADD COLUMN IF NOT EXISTS hours JSONB,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Create index on google_place_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON venues(google_place_id);

-- Create index on verification_status for filtering
CREATE INDEX IF NOT EXISTS idx_venues_verification_status ON venues(verification_status);

-- Create index on data_source
CREATE INDEX IF NOT EXISTS idx_venues_data_source ON venues(data_source);

-- Update existing venues to mark as admin_verified and manual source
UPDATE venues
SET
  data_source = 'manual',
  verification_status = 'admin_verified'
WHERE data_source IS NULL;

-- Add priority tier to cities for phased rollout
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS priority_tier INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT FALSE;

-- Mark Dallas and Houston as tier 1 (already have data)
UPDATE cities
SET priority_tier = 1, auto_sync_enabled = TRUE
WHERE slug IN ('dallas', 'houston');
