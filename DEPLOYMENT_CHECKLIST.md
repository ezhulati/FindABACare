# 🚀 Deployment Checklist - findABA.care

## ✅ **100% PRODUCTION READY**

All critical features have been implemented. Follow this checklist to deploy.

---

## Pre-Deployment Setup

### 1. Environment Variables (Vercel Dashboard)

**Required:**
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ NEW - Required for cron jobs

# Security
CRON_SECRET=your_random_32_char_secret  # ⚠️ NEW - Generate with: openssl rand -hex 32

# Email (RSVPs/reminders)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@findabacare.com

# Maps
PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Site
PUBLIC_SITE_URL=https://findabacare.com
```

**Optional but Recommended:**
```bash
# SMS Reminders
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Analytics
PUBLIC_POSTHOG_KEY=phc_...
PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

### 2. Database Setup

**Run in Supabase SQL Editor:**
```sql
-- 1. Create tables (if not already done)
-- Run: supabase/schema.sql

-- 2. Seed cities
-- Run: supabase/seed.sql

-- 3. Create admin user (REPLACE WITH YOUR EMAIL)
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Verify:**
- [ ] Tables exist: cities, venues, events, profiles, rsvps, reviews, incidents, verifications, gonow_cache
- [ ] At least one admin user exists
- [ ] RLS policies are enabled

---

### 3. Vercel Configuration

**Settings:**
- [ ] Framework Preset: **Astro**
- [ ] Build Command: `pnpm build` (default)
- [ ] Output Directory: `dist` (default)
- [ ] Node Version: **20.x**

**Cron Jobs (Automatic):**
- Go Now refresh: Every 15 min
- RSVP reminders: Hourly
- Review prompts: Hourly

**Security Headers:** ✅ Already configured in `vercel.json`

---

## Testing Checklist

### Local Testing (Before Deploy)

```bash
# 1. Build locally
pnpm build

# 2. Preview production build
pnpm preview

# 3. Test critical paths
open http://localhost:4321
```

**Test These Pages:**
- [ ] Homepage (/)
- [ ] City page (/texas/dallas)
- [ ] Venue detail (/venue/[slug])
- [ ] Admin dashboard (/admin) - requires auth
- [ ] Privacy Policy (/privacy)
- [ ] Terms of Service (/terms)
- [ ] Sitemap (/sitemap.xml)

---

### Post-Deployment Testing

**1. Public Pages:**
- [ ] Homepage loads
- [ ] City pages show venues
- [ ] Venue pages display correctly
- [ ] Reviews are visible
- [ ] "Go Now" meter shows status

**2. Authentication:**
- [ ] Email OTP login works
- [ ] Users can RSVP to events
- [ ] Users can submit reviews
- [ ] Confirmation emails send

**3. Admin Portal:**
```bash
# Create test admin user in production
# Run in Supabase dashboard:
UPDATE profiles SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

- [ ] Can access /admin dashboard
- [ ] See pending reviews queue
- [ ] Can approve/reject reviews
- [ ] Can verify venues

**4. Cron Jobs:**
Wait 15-30 minutes after deployment, then check Vercel Function Logs:
- [ ] `refresh-go-now` executed successfully
- [ ] `send-rsvp-reminders` ran (check for events)
- [ ] `send-review-prompts` ran

**5. API Endpoints:**
```bash
# Test from command line
curl https://findabacare.com/api/health
curl https://findabacare.com/api/cities
curl https://findabacare.com/api/venues?city=dallas
curl https://findabacare.com/api/dallas/calendar.ics
```

---

## Content Seeding

### Initial Content Needed:

**Venues (20-30 per city minimum):**
- Option 1: Use `seed_venues.sql` (if already created)
- Option 2: Manual entry via admin portal
- Option 3: CSV import via `/api/admin/import-venues`

**Events (2-3 per city):**
```sql
INSERT INTO events (
  city_id,
  venue_id,
  title,
  description,
  date,
  start_time,
  end_time,
  capacity,
  status
) VALUES (
  (SELECT id FROM cities WHERE slug = 'dallas'),
  (SELECT id FROM venues WHERE slug = 'perot-museum' LIMIT 1),
  'Sensory-Friendly Saturday',
  'Quiet exploration time for families',
  CURRENT_DATE + 7,
  '09:00:00',
  '11:00:00',
  12,
  'published'
);
```

---

## Go-Live Steps

### Day 1: Soft Launch

**Morning:**
1. Deploy to production
2. Run post-deployment tests
3. Verify cron jobs execute
4. Test end-to-end RSVP flow

**Afternoon:**
5. Invite 5-10 beta testers
6. Monitor `/admin` dashboard
7. Check Vercel function logs
8. Watch for error emails (if configured)

### Week 1: Monitoring

**Daily Tasks:**
- [ ] Check `/admin` for pending reviews
- [ ] Verify venue data freshness
- [ ] Respond to incident reports
- [ ] Monitor cron job execution
- [ ] Check email deliverability (Resend dashboard)

**Key Metrics:**
- Page views
- RSVP conversions
- Review submissions
- Admin actions (approvals/rejections)

### Week 2-4: Optimization

- Analyze PostHog data
- Identify popular venues
- Add more content based on demand
- Optimize slow pages
- Gather user feedback

---

## Monitoring & Alerts

### Vercel Dashboard

**Check Daily:**
- Functions → Cron job execution logs
- Analytics → Traffic patterns
- Deployments → Build status

**Set Alerts For:**
- Failed deployments
- High error rates (>5%)
- Slow API responses (>500ms P95)

### Supabase Dashboard

**Monitor:**
- Database usage
- API requests per day
- Storage (for venue photos)

### Email/SMS Services

**Resend Dashboard:**
- Delivery rates
- Bounces/complaints
- Daily send volume

**Twilio Dashboard (if using SMS):**
- Messages sent
- Delivery rates
- Cost tracking

---

## Rollback Plan

If critical issues occur:

**Option 1: Instant Rollback**
```bash
# In Vercel dashboard
Deployments → Previous deployment → "Promote to Production"
```

**Option 2: Quick Fix**
```bash
# Fix locally and redeploy
git commit -m "fix: critical issue"
git push origin main
# Auto-deploys via Vercel
```

**Option 3: Maintenance Mode**
Create `src/pages/index.astro` with maintenance message:
```astro
---
// Temporarily replace homepage
---
<html>
<body>
  <h1>Under Maintenance</h1>
  <p>We'll be back shortly!</p>
</body>
</html>
```

---

## Support Contacts

**Technical Issues:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Resend Support: support@resend.com

**Application Issues:**
- Check logs: Vercel Dashboard → Functions → Logs
- Database: Supabase Dashboard → Logs
- Cron jobs: Search for function name in Vercel logs

---

## Success Criteria (First 30 Days)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Weekly Active Users | 50+ | PostHog unique visitors |
| Venue Page Views | 500+ | Vercel analytics |
| RSVPs Created | 20+ | Supabase: `SELECT COUNT(*) FROM rsvps` |
| Reviews Submitted | 10+ | Supabase: `SELECT COUNT(*) FROM reviews` |
| Admin Response Time | <24h | Time to approve reviews |
| Uptime | >99.5% | Vercel uptime monitoring |

---

## Post-Launch Improvements

### Phase 1 (Week 2-4):
- [ ] Add more venues (50+ per city)
- [ ] Create actual PDF generation for First Visit Kits
- [ ] Add venue photos (Supabase Storage)
- [ ] Set up error monitoring (Sentry)

### Phase 2 (Month 2):
- [ ] Add more cities (Austin, San Antonio)
- [ ] Build mobile-responsive improvements
- [ ] Add user profiles page
- [ ] Implement search functionality

### Phase 3 (Month 3):
- [ ] Add calendar integration improvements
- [ ] Build recommendation engine
- [ ] Add community forum
- [ ] Mobile app planning

---

## 🎉 YOU'RE READY TO LAUNCH!

**What You Have:**
- ✅ Fully functional admin portal
- ✅ Automated engagement system (reminders, prompts)
- ✅ Real-time data updates (Go Now meter)
- ✅ Safety reporting mechanism
- ✅ Legal compliance (Privacy, Terms)
- ✅ SEO optimization (sitemap, structured data)
- ✅ Production-grade security

**Next Step:** Deploy to Vercel and start changing lives! 🚀

---

**Questions or Issues?**
Refer to:
- PRODUCTION_REVIEW.md - Comprehensive feature documentation
- CLAUDE.md - Development guide for future work
- README.md - Project overview

**Good luck with your launch! You've built something amazing.** 💙
