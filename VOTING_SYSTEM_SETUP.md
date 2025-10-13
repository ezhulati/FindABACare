# Voting & Review System Setup

## Overview
The voting and review system has been fully implemented with profile completion onboarding. All components are in place:

- ✅ Database migrations created (votes + profile fields)
- ✅ API endpoints for voting (`/api/venue-vote`)
- ✅ Vote button component (`VenueVoteButton.tsx`)
- ✅ Review form component (`VenueReviewForm.tsx`)
- ✅ Review list component (`VenueReviewsList.tsx`)
- ✅ Profile onboarding component (`ProfileOnboarding.tsx`)
- ✅ Integrated on venue detail pages

## What You Need To Do

### Step 1: Run the Database Migrations

You need to run TWO migrations in this order:

#### Migration 1: Voting System (`add_venue_votes.sql`)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file `supabase/migrations/add_venue_votes.sql` from this project
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run** (or press Cmd+Enter)

This migration creates:
- `venue_votes` table with indexes
- `upvotes`, `downvotes`, `vote_score` columns on `venues`  table
- Automatic vote counting triggers
- RLS policies for voting

#### Migration 2: Profile Fields (`add_profile_fields.sql`)

1. In the same SQL Editor, click **New Query** again
2. Open the file `supabase/migrations/add_profile_fields.sql`
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** (or press Cmd+Enter)

This migration adds:
- `first_name`, `last_name`, `avatar_url`, `profile_completed` columns to `profiles` table
- `avatars` storage bucket for profile photos
- Storage policies for avatar uploads

### Step 2: Update Your Existing Profile

Run this command in your terminal to update your profile with your information:

```bash
cd "/Users/ez/Desktop/AI Library/Apps/FindABACare"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zmt5Znp1a3duam9ta3N1dmFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE0NTQxNSwiZXhwIjoyMDc1NzIxNDE1fQ.oP1P1VSRRB_TCmEooniSoOmS-ey4oVf8aXAaADqo1F8" npx tsx scripts/update-profile.ts
```

This will set:
- First Name: Enri
- Last Name: Zhulati
- Display Name: Enri Z.
- Location: Dallas, TX

### Step 3: Verify Everything Worked

After running both migrations and the profile update:

1. In Supabase Dashboard, go to **Table Editor**
2. Click on `venues` table - should see `upvotes`, `downvotes`, `vote_score` columns
3. Click on `venue_votes` table - should exist (will be empty initially)
4. Click on `profiles` table - should see `first_name`, `last_name`, `avatar_url`, `profile_completed` columns
5. Find your profile row (enrizhulati@gmail.com) - should show your name and Dallas city
6. Go to **Storage** - should see `avatars` bucket

### Step 3: Update the Venue Query (Optional)

After the migration is complete, you can optionally update the venue query to include vote counts in the initial page load. Open:

`src/pages/venue/[slug]/index.astro` around line 30

Change from:
```typescript
const { data: venue } = await supabase
  .from('venues')
  .select(`
    *,
    city:cities(*)
  `)
  .eq('slug', slug)
  .eq('status', 'active')
  .single();
```

To:
```typescript
const { data: venue } = await supabase
  .from('venues')
  .select(`
    *,
    city:cities(*),
    upvotes,
    downvotes,
    vote_score
  `)
  .eq('slug', slug)
  .eq('status', 'active')
  .single();
```

**Note:** This is optional because the components already fetch updated vote counts dynamically. This just makes the initial load slightly faster.

## How the System Works

### Voting
1. User clicks up/down arrow on a venue
2. If not logged in, modal prompts them to sign in
3. If logged in, vote is submitted to `/api/venue-vote`
4. Database trigger automatically updates vote counts
5. UI updates in real-time to show new counts

**Vote Logic:**
- Clicking same button = remove vote (unvote)
- Clicking opposite button = change vote
- One vote per user per venue

### Profile Onboarding (New!)
1. When user signs in for the first time (or has incomplete profile), they see onboarding modal
2. Modal asks for:
   - Profile photo upload (optional, max 2MB)
   - First name (required)
   - Last name (required)
   - City/location (required)
3. Display name is automatically generated as "FirstName L." (last initial only)
4. Profile marked as `profile_completed: true`
5. **For already signed-in users:** System checks profile completion status and shows modal if needed

### Reviews
1. User clicks "Write a Review" button
2. If not logged in OR profile not completed, shown appropriate prompt
3. If logged in with complete profile, form appears with:
   - 3 star ratings (Predictability, Sensory-Friendly, Staff Knowledge)
   - Text review (required)
   - Best time to visit (optional)
   - Sensory triggers checkboxes (optional)
4. Review submitted with `status: 'pending'`
5. Admin approves review via admin panel
6. Published reviews appear on venue page with aggregate stats
7. Reviews show display name ("Enri Z.") not full last name

### Aggregate Stats
The "Community Feedback" section shows:
- Net vote score (upvotes - downvotes) with color coding
- Average ratings across all published reviews
- Total review count
- Individual review cards

## Testing After Migration

### Test Voting:
1. Go to any venue detail page (e.g., `/texas/dallas/venues/dallas-zoo`)
2. Click the upvote arrow
3. You should see login prompt if not signed in
4. Sign in with email OTP
5. Click upvote again - should show green highlight and increment count
6. Click upvote again - should remove vote and decrement count
7. Click downvote - should switch to downvote

### Test Reviews:
1. On a venue page, click "Write a Review"
2. Fill out all three star ratings
3. Write review text
4. Optionally add best time and triggers
5. Submit
6. Should see "Thank you" message
7. Go to admin panel to approve the review
8. Check that review appears on venue page

## Troubleshooting

**Issue:** Venue pages still redirect to homepage
**Solution:** Make sure you've run the migration. The vote count columns need to exist.

**Issue:** "Authentication required" error when voting
**Solution:** Make sure you're signed in. Check that RLS policies were created by the migration.

**Issue:** Votes don't update counts
**Solution:** Check that the database triggers were created. Look in Supabase Dashboard > Database > Triggers.

**Issue:** Review doesn't appear after submission
**Solution:** Reviews start with `status: 'pending'` and need admin approval. Check the admin panel.

## Migration File Location

The complete migration is in:
```
supabase/migrations/add_venue_votes.sql
```

This file is safe to run multiple times (uses `if not exists` checks).
