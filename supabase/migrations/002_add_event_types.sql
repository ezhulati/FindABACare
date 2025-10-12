-- Migration: Add support for multiple event types
-- This enables partner events (scraped), official autism.place events, and community events

-- Add event_type column to distinguish between event types
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN ('partner', 'official', 'community')) DEFAULT 'official';

-- Add source_url for partner events (where we scraped them from)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS source_url text;

-- Add source_name for partner events (e.g., "Finding Y'all")
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS source_name text;

-- Add approval_status for community events moderation
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected', 'flagged')) DEFAULT 'approved';

-- Add admin_notes for moderation workflow
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add approved_by to track which admin approved the event
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);

-- Add approved_at timestamp
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Add scraped_at timestamp for partner events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS scraped_at timestamptz;

-- Add last_synced_at for tracking when we last checked partner event for updates
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add is_featured flag for highlighting special events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Add external_id for tracking partner events (to avoid duplicates on re-scraping)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS external_id text;

-- Create index for event_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);

-- Create index for approval_status for moderation queue
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON public.events(approval_status);

-- Create index for external_id to check for duplicate partner events
CREATE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id);

-- Create composite index for published events by type
CREATE INDEX IF NOT EXISTS idx_events_published_by_type
ON public.events(status, event_type, date)
WHERE status = 'published' AND approval_status = 'approved';

-- Update RLS policies for new event types

-- Drop existing events read policy
DROP POLICY IF EXISTS "events_read_published" ON public.events;

-- Create new read policy that also checks approval_status
CREATE POLICY "events_read_published" ON public.events
FOR SELECT USING (
  status = 'published'
  AND approval_status = 'approved'
);

-- Drop existing events insert policy
DROP POLICY IF EXISTS "events_insert_admin" ON public.events;

-- Create new insert policies for different event types

-- Official events: Only admins can create
CREATE POLICY "events_insert_official" ON public.events
FOR INSERT WITH CHECK (
  event_type = 'official'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partner events: Only admins can create (from scrapers)
CREATE POLICY "events_insert_partner" ON public.events
FOR INSERT WITH CHECK (
  event_type = 'partner'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Community events: Any authenticated user can create (pending approval)
CREATE POLICY "events_insert_community" ON public.events
FOR INSERT WITH CHECK (
  event_type = 'community'
  AND auth.uid() = host_profile_id
  AND approval_status = 'pending'
);

-- Admins can update any event
CREATE POLICY "events_update_admin" ON public.events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Users can update their own community events if still pending
CREATE POLICY "events_update_own_pending" ON public.events
FOR UPDATE USING (
  event_type = 'community'
  AND auth.uid() = host_profile_id
  AND approval_status = 'pending'
);

-- Add comments for documentation
COMMENT ON COLUMN public.events.event_type IS 'Type of event: partner (scraped), official (autism.place branded), community (user-submitted)';
COMMENT ON COLUMN public.events.source_url IS 'Original URL for partner events';
COMMENT ON COLUMN public.events.source_name IS 'Organization name for partner events (e.g., Finding Y''all)';
COMMENT ON COLUMN public.events.approval_status IS 'Approval status for moderation workflow';
COMMENT ON COLUMN public.events.external_id IS 'External identifier to prevent duplicate scraping';
