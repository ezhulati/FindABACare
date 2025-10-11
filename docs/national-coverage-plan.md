# National Coverage Implementation Plan

## Phase 1: Database Schema Updates (Week 1)

### New Tables

#### 1. `reviews` table
```sql
- id (uuid)
- venue_id (uuid, FK to venues)
- user_id (uuid, FK to auth.users)
- rating (integer, 1-5)
- comment (text)
- helpful_count (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `user_photos` table
```sql
- id (uuid)
- venue_id (uuid, FK to venues)
- user_id (uuid, FK to auth.users)
- photo_url (text)
- caption (text)
- approved (boolean)
- created_at (timestamp)
```

#### 3. `calm_windows` table
```sql
- id (uuid)
- venue_id (uuid, FK to venues)
- day_of_week (integer, 0-6)
- start_time (time)
- end_time (time)
- crowd_level (text: 'quiet', 'moderate', 'busy')
- verified_by_user_id (uuid)
- confidence_score (float)
- created_at (timestamp)
```

### Updated `venues` Table Schema
```sql
- Add: google_place_id (text, indexed)
- Add: data_source (text: 'manual', 'google_places', 'user_submitted')
- Add: verification_status (text: 'unverified', 'community_verified', 'admin_verified')
- Add: review_count (integer)
- Add: average_rating (float)
- Add: last_synced_at (timestamp)
```

### Updated `cities` Table Schema
```sql
- Add: population (integer)
- Add: priority_tier (integer: 1=top50, 2=top100, 3=other)
- Add: auto_sync_enabled (boolean)
```

## Phase 2: Google Places Automation (Week 2)

### Venue Types to Fetch
- Museums
- Parks
- Libraries
- Aquariums
- Zoos
- Movie theaters
- Restaurants (with play areas)
- Recreation centers
- Bowling alleys
- Trampoline parks
- Sensory gyms
- Indoor play spaces

### Automation Scripts
1. `scripts/fetch-top-cities.ts` - Get top 50 US cities
2. `scripts/bulk-fetch-venues.ts` - Fetch venues for all cities
3. `scripts/sync-venue-details.ts` - Update venue details monthly
4. `scripts/classify-autism-friendly.ts` - AI classification of venues

### Cost Management
- Cache Google Places responses for 30 days
- Batch requests (max 100/day per city)
- Use free tier credits ($200/month)
- Estimated: $300-400/month at scale

## Phase 3: Address Search (Week 3)

### Features
- Autocomplete address search
- Geolocation detection
- "Near me" functionality
- Search by city, state, or ZIP
- Dynamic venue loading based on location

### Implementation
- Use Google Places Autocomplete API
- Implement radius-based search (1mi, 5mi, 10mi, 25mi)
- Cache search results
- Progressive loading of venues

## Phase 4: Community Features (Week 4-5)

### 4a. Reviews & Ratings
- Star ratings (1-5)
- Written reviews
- Helpful voting
- Report inappropriate content
- Moderation queue

### 4b. Photo Uploads
- User-submitted photos
- Admin approval workflow
- Image optimization and CDN
- Photo galleries per venue

### 4c. Real-Time Crowd Data
- Check-in system
- Current crowd level indicators
- Historical crowd patterns
- Best time to visit recommendations

## Phase 5: Quality & Trust (Week 6)

### Verification System
- User verification badges
- Admin verification badges
- Community consensus (5+ positive reviews = verified)
- Parent testimonials

### AI-Assisted Quality
- Auto-flag suspicious reviews
- Suggest amenities based on venue type
- Predict autism-friendliness score
- Recommend similar venues

## Success Metrics

### Coverage
- [ ] 50 major US cities
- [ ] 25,000+ venues
- [ ] All 50 states represented

### Engagement
- [ ] 100+ user reviews/month
- [ ] 50+ photo uploads/month
- [ ] 1,000+ monthly active users

### Quality
- [ ] 80%+ venues with photos
- [ ] 50%+ venues with reviews
- [ ] 90%+ user satisfaction

## Timeline

- **Week 1**: Database schema + migrations
- **Week 2**: Google Places automation
- **Week 3**: Address search + geolocation
- **Week 4**: Reviews + ratings system
- **Week 5**: Photo uploads + calm windows
- **Week 6**: Verification + AI features
- **Week 7**: Testing + refinement
- **Week 8**: Launch + marketing

## Budget Estimate

- Google Places API: $400/month
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- CDN/Storage: $50/month
- **Total: ~$500/month**

## Next Steps

1. Create database migrations for new schema
2. Build Google Places automation scripts
3. Implement address search UI
4. Launch beta with top 10 cities
5. Gather feedback and iterate
