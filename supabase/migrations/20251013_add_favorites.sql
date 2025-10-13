-- Create favorites table
CREATE TABLE IF NOT EXISTS venue_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only favorite a venue once
  UNIQUE(profile_id, venue_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_venue_favorites_profile ON venue_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_venue_favorites_venue ON venue_favorites(venue_id);

-- Add RLS policies
ALTER TABLE venue_favorites ENABLE ROW LEVEL SECURITY;

-- Users can read all favorites (to see favorite counts)
CREATE POLICY "Anyone can view favorites"
  ON venue_favorites FOR SELECT
  USING (true);

-- Users can only insert their own favorites
CREATE POLICY "Users can favorite venues"
  ON venue_favorites FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can unfavorite venues"
  ON venue_favorites FOR DELETE
  USING (auth.uid() = profile_id);

-- Add favorite_count to venues table (denormalized for performance)
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Create function to update favorite count
CREATE OR REPLACE FUNCTION update_venue_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE venues
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.venue_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE venues
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.venue_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update favorite count
DROP TRIGGER IF EXISTS trigger_update_favorite_count ON venue_favorites;
CREATE TRIGGER trigger_update_favorite_count
  AFTER INSERT OR DELETE ON venue_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_favorite_count();
