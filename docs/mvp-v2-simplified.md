# FindABACare MVP v2 - Simplified Plan

## Core Problem
Parents need to find autism-friendly venues nationwide, with trusted community feedback.

## MVP Solution (4 Weeks)

### Week 1: National Coverage
**Goal**: Get 25,000 venues across top 50 US cities

**What to build:**
1. Script to fetch venues from Google Places for 50 cities
2. Auto-classify by type (museum, park, library, etc.)
3. Store with `data_source: 'google_places'` and `verification_status: 'unverified'`

**Database changes:**
```sql
ALTER TABLE venues ADD COLUMN google_place_id TEXT;
ALTER TABLE venues ADD COLUMN data_source TEXT DEFAULT 'manual';
ALTER TABLE venues ADD COLUMN verification_status TEXT DEFAULT 'unverified';
```

**Script:**
```bash
npm run fetch:venues -- --cities=top50 --types=all
```

### Week 2: Address Search
**Goal**: Let parents search "near me" or by address

**What to build:**
1. Homepage with address autocomplete
2. `/search?lat=32.77&lng=-96.79&radius=5` route
3. Results page showing nearby venues
4. "Use my location" button

**UI:**
```
Homepage:
- Big search bar: "Find autism-friendly places near you"
- Autocomplete powered by Google Places
- Or: "Use my location" button
→ Results page with map + list
```

### Week 3: Reviews System
**Goal**: Let parents rate and review venues

**What to build:**
1. Star ratings (1-5)
2. Simple text review
3. "Helpful" button
4. Show on venue pages

**Database:**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**UI:**
```
Venue page:
- Overall rating (4.5 ⭐ from 12 reviews)
- "Write a review" button (requires login)
- List of reviews with helpful votes
```

### Week 4: Community Trust
**Goal**: Build trust through verification

**What to build:**
1. Verification badges (5+ reviews = verified)
2. User profiles (name, avatar, review count)
3. Simple leaderboard (top reviewers)
4. "Thank you" notifications

**Trust indicators:**
```
Venue cards:
- ✓ Verified by 12 families
- ⭐ 4.5 rating (12 reviews)
- 📸 15 photos

User profile:
- Display name
- Member since
- 12 reviews
- 8 helpful votes
```

## What We're NOT Building (Yet)

❌ Forums/discussions - Too complex
❌ Photo uploads - Focus on Google Photos first
❌ Real-time crowd data - Need users first
❌ Gamification/badges - Nice-to-have
❌ Advanced moderation - Start simple

## Simplified Database Schema

```sql
-- User Profiles (minimal)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful votes
CREATE TABLE helpful_votes (
  user_id UUID REFERENCES auth.users(id),
  review_id UUID REFERENCES reviews(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, review_id)
);

-- Update venues table
ALTER TABLE venues
  ADD COLUMN google_place_id TEXT,
  ADD COLUMN data_source TEXT DEFAULT 'manual',
  ADD COLUMN verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN review_count INTEGER DEFAULT 0,
  ADD COLUMN average_rating DECIMAL(2,1);
```

## SEO Strategy (Passive Growth)

### URL Structure (Already done ✅)
```
/tx/dallas
/tx/dallas/museums
/ca/los-angeles
/ca/los-angeles/parks
```

### Content Pages (Simple)
```
/best-autism-friendly-museums
/sensory-friendly-activities
/autism-friendly-restaurants
```

### Meta (Already done ✅)
- Title: "Autism-Friendly Museums in Dallas, TX"
- Description: "Find autism-friendly museums in Dallas..."
- OG images

## Growth Strategy

### Week 1-2: Launch
- Soft launch with email list
- Post in autism parent Facebook groups
- Reach out to local autism organizations

### Week 3-4: Iterate
- Get first 50 reviews
- Fix bugs and UX issues
- Add top-requested features

### Month 2: Scale
- Add more cities based on demand
- Partner with autism organizations
- Start content marketing (blog posts)

## Success Metrics

### Month 1 Goals
- [ ] 25,000 venues in database
- [ ] 100 user signups
- [ ] 50 reviews written
- [ ] 1,000 searches performed

### Month 3 Goals
- [ ] 50,000 venues
- [ ] 500 user signups
- [ ] 250 reviews
- [ ] 10,000 searches/month

## Implementation Order

### Sprint 1 (Week 1)
1. Add database columns for national coverage
2. Build Google Places fetch script
3. Run script for top 10 cities (test)
4. Deploy

### Sprint 2 (Week 2)
1. Build address search homepage
2. Implement search results page
3. Add geolocation
4. Run fetch script for remaining 40 cities
5. Deploy

### Sprint 3 (Week 3)
1. Set up Supabase Auth
2. Create user_profiles and reviews tables
3. Build review form component
4. Add reviews to venue pages
5. Deploy

### Sprint 4 (Week 4)
1. Build user profile pages
2. Add verification badges
3. Create simple leaderboard
4. Polish and bug fixes
5. Launch publicly

## Key Decisions

### Use Google Places Photos (No uploads yet)
- Every venue already has photos from Google
- Save development time
- Add user uploads later

### No Forum (Use reviews instead)
- Reviews are simpler
- Still builds community
- Add forum later if needed

### Auto-verify at 5+ reviews
- Crowd-sourced trust
- No manual verification needed
- Clear threshold

### Start with top 50 cities
- Covers 40% of US population
- Manageable scope
- Expand based on demand

## Budget

- Google Places API: ~$300/month (initial fetch + monthly updates)
- Supabase: $25/month (Pro plan)
- Vercel: $20/month (Pro plan)
- **Total: ~$350/month**

## Launch Checklist

- [ ] 25,000+ venues loaded
- [ ] Search working nationwide
- [ ] Reviews system functional
- [ ] User auth working
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Analytics set up
- [ ] Error monitoring (Sentry)
- [ ] Email notifications
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Community Guidelines

## Post-Launch Roadmap

### Month 2-3
- User photo uploads
- Basic notifications
- Email digests

### Month 4-6
- Community discussions/forums
- Real-time crowd data
- Mobile app (React Native)

### Month 7-12
- Gamification/badges
- Partner integrations
- Premium features

## The Core Loop

```
Parent searches for venue
    ↓
Finds venue with reviews
    ↓
Visits venue
    ↓
Writes review to help others
    ↓
Repeat
```

## Why This Will Work

1. **Solve real problem**: Parents struggle to find autism-friendly places
2. **Network effects**: More reviews → more trust → more users → more reviews
3. **Low barrier**: Easy to search, easy to review
4. **Community-driven**: By autism parents, for autism parents
5. **SEO moat**: Location-based content is hard to replicate

---

**Next Step: Start with Sprint 1 (Week 1) - National Coverage**

Do you want me to begin implementing the Google Places automation script?
