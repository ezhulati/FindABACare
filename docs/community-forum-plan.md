# Community Forum & Discussion Platform

## Forum Structure

### Categories
1. **General Discussion**
   - Introductions
   - Off-topic
   - Community support

2. **Venue Discussions** (per city)
   - Dallas Venues
   - Houston Venues
   - Austin Venues (etc.)

3. **Tips & Strategies**
   - Sensory-friendly tips
   - Communication strategies
   - Meltdown management
   - Travel tips

4. **Ask the Community**
   - Venue recommendations
   - Activity suggestions
   - Planning advice

5. **Success Stories**
   - Positive experiences
   - Milestone celebrations
   - Community wins

6. **Advocacy & Awareness**
   - Local advocacy
   - Business outreach
   - Educational resources

## Database Schema for Forums

```sql
-- Forums/Categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discussion Threads
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES forum_categories(id),
  venue_id UUID REFERENCES venues(id) NULL, -- optional link to venue
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP,
  last_reply_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Thread Replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parent_reply_id UUID REFERENCES forum_replies(id) NULL, -- for nested replies
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE, -- mark as solution to thread
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT, -- city, state
  joined_at TIMESTAMP DEFAULT NOW(),

  -- Contribution Stats
  review_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,

  -- Gamification
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
  badges JSONB DEFAULT '[]',

  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  show_in_leaderboard BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Helpful Votes (for replies and reviews)
CREATE TABLE helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- 'reply', 'review'
  content_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'reply', 'mention', 'helpful_vote', 'badge_earned'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Badges/Achievements
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB, -- { "type": "review_count", "threshold": 10 }
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Badges (many-to-many)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

## Gamification System

### Points System
```typescript
const POINTS = {
  REVIEW: 10,
  PHOTO_UPLOAD: 5,
  THREAD_CREATE: 5,
  REPLY: 2,
  CHECK_IN: 2,
  HELPFUL_VOTE: 1,
  SOLUTION_MARKED: 20,
};
```

### Levels
- **Bronze (0-99 pts)**: New Contributor
- **Silver (100-499 pts)**: Active Contributor
- **Gold (500-1999 pts)**: Trusted Contributor
- **Platinum (2000+ pts)**: Elite Contributor

### Badges
```typescript
const BADGES = [
  // Review Badges
  { name: "First Review", criteria: "review_count >= 1" },
  { name: "Reviewer", criteria: "review_count >= 10" },
  { name: "Super Reviewer", criteria: "review_count >= 50" },
  { name: "Review Legend", criteria: "review_count >= 100" },

  // Photo Badges
  { name: "Photographer", criteria: "photo_count >= 10" },
  { name: "Photo Pro", criteria: "photo_count >= 50" },

  // Community Badges
  { name: "Conversation Starter", criteria: "thread_count >= 5" },
  { name: "Helpful Parent", criteria: "helpful_count >= 25" },
  { name: "Solution Provider", criteria: "solution_count >= 5" },

  // Special Badges
  { name: "Early Adopter", criteria: "joined_before = '2025-12-31'" },
  { name: "City Champion", criteria: "most_reviews_in_city" },
  { name: "Weekly Contributor", criteria: "active_7_days_straight" },
];
```

## Forum Features

### Core Features
- [x] Thread creation and replies
- [x] Nested comments (1 level deep)
- [x] Rich text editor (markdown)
- [x] @mentions
- [x] "Helpful" voting
- [x] Mark solution
- [x] Pin threads
- [x] Lock threads (mods only)
- [x] Report content
- [x] Search threads
- [x] Subscribe to threads

### Moderation
- **Auto-moderation**: Flag spam, inappropriate content
- **Community moderation**: Report button
- **Admin tools**: Pin, lock, delete, ban
- **Mod queue**: Review flagged content

### Notifications
- Reply to your thread
- Reply to your comment
- @mention
- Helpful vote received
- Badge earned
- Solution marked

## User Profile Features

### Public Profile
```
/profile/username

- Display name & avatar
- Bio
- Location (city, state)
- Joined date
- Level & badge collection
- Stats:
  - 42 reviews
  - 15 photos
  - 8 discussions started
  - 124 helpful votes
- Recent activity
- Top-rated reviews
```

### Leaderboards
```
/leaderboard

Tabs:
- All Time
- This Month
- This Week

Metrics:
- Most Reviews
- Most Photos
- Most Helpful
- Top Contributors (by points)

Filters:
- By City
- By Category
```

## Why Parents Will Contribute

### Emotional Drivers
1. **"I wish this existed when I started"**
   - Pay it forward mentality
   - Help other parents avoid struggles

2. **"I'm not alone"**
   - Connect with other autism parents
   - Share experiences and strategies

3. **"Making a difference"**
   - Building something bigger than themselves
   - Advocacy through contribution

4. **"Recognition"**
   - Be recognized as helpful community member
   - Build reputation as trusted resource

### Practical Drivers
1. **Ask questions, get answers**
   - Crowd-sourced local knowledge
   - Real parents with real experience

2. **Discover new places**
   - Learn about venues they didn't know existed
   - Get personalized recommendations

3. **Plan outings confidently**
   - Read recent reviews before visiting
   - Know what to expect

4. **Track favorites**
   - Save venues they love
   - Get notifications about updates

## Integration with Main Site

### Venue Pages
```
On each venue page:
- "Discuss this venue" button → Opens venue-specific forum thread
- Recent community comments (3 most recent)
- "Join the conversation" CTA
```

### Homepage
```
- "Community Highlights" section
  - Featured discussion
  - Top contributor of the week
  - Recent helpful reviews
```

### User Navigation
```
Navbar:
- Community (dropdown)
  - Discussions
  - My Profile
  - Leaderboard
  - Notifications (with badge count)
```

## Moderation Strategy

### Community Guidelines
1. Be respectful and kind
2. No personal attacks
3. No spam or self-promotion
4. Protect privacy (no personal info)
5. Stay on topic
6. Report, don't engage with trolls

### Mod Team
- Start with you as admin
- Recruit trusted community members as mods
- 1 mod per 100 active users

### Tools
- Auto-flag: profanity, spam patterns
- Manual review queue
- Ban system (temp/permanent)
- Warning system (3 strikes)

## Implementation Priority

### Phase 1 (MVP)
1. User profiles
2. Basic forum (threads + replies)
3. Points system
4. Basic badges

### Phase 2
1. Gamification UI
2. Leaderboards
3. Notifications
4. Moderation tools

### Phase 3
1. Advanced features (@mentions, subscriptions)
2. Rich text editor
3. Search
4. Analytics

## Success Metrics

### Engagement
- 10% of visitors create accounts
- 20% of accounts contribute (reviews/posts)
- Average 3 contributions per active user/month

### Retention
- 30% return within 7 days
- 50% active users return monthly

### Content Quality
- 90% of reviews are helpful (positive votes)
- <1% flagged content
- Average response time <24 hours

## Next Steps

1. Create database migrations
2. Build user authentication (Supabase Auth)
3. Create user profile pages
4. Build forum UI
5. Implement points/badges system
6. Launch with beta users
