# FindABACare Deployment Guide

## Prerequisites

- Supabase project created (project ref: `gvfkyfzukwnjomksuvaq`)
- Vercel account
- GitHub repository connected to Vercel
- Required API keys (Mapbox, Resend, Twilio, Upstash)

## 1. Supabase Setup

### Deploy Database Schema

1. Go to your Supabase project: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script
5. Copy and paste the contents of `supabase/seed.sql`
6. Run the seed script to create Dallas and Houston cities

### Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Magic Link
   - Confirmation
   - Password Reset

### Get API Keys

From your Supabase project dashboard:
- **Project URL**: `https://gvfkyfzukwnjomksuvaq.supabase.co`
- **Anon/Public Key**: Settings → API → `anon` `public` key
- **Service Role Key**: Settings → API → `service_role` key (keep secret!)

## 2. External Services Setup

### Mapbox (Required for Map Features)

1. Sign up at https://mapbox.com
2. Create a new access token
3. Copy the token (starts with `pk.`)

### Resend (Required for Email Notifications)

1. Sign up at https://resend.com
2. Add your sending domain (or use Resend's test domain)
3. Create an API key
4. Copy the key (starts with `re_`)

### Twilio (Optional - SMS Notifications)

1. Sign up at https://twilio.com
2. Get your Account SID and Auth Token
3. Get a Twilio phone number
4. Copy credentials

### Upstash Redis (Optional - Rate Limiting)

1. Sign up at https://upstash.com
2. Create a Redis database
3. Get the REST API URL and Token
4. Copy credentials

## 3. Vercel Deployment

### Connect Repository

1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository: `ezhulati/FindABACare`
4. Vercel will auto-detect it as an Astro project

### Configure Environment Variables

In Vercel project settings → Environment Variables, add:

#### Required Variables

```bash
# Supabase
SUPABASE_URL=https://gvfkyfzukwnjomksuvaq.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_SUPABASE_URL=https://gvfkyfzukwnjomksuvaq.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox
PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# Resend (Email)
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Optional Variables (for full functionality)

```bash
# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Deploy Settings

- **Framework Preset**: Astro
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node Version**: 18.x or higher

### Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed URL

## 4. Post-Deployment Verification

### Test Core Features

1. **Homepage**: Visit root URL, check city cards load
2. **City Pages**: Click Dallas/Houston, verify venues list (may be empty initially)
3. **Authentication**: Try signing in with email
4. **API Health**: Visit `/api/health` - should return JSON with status "ok"

### Add Test Data (Optional)

Run these SQL commands in Supabase SQL Editor to add test venues:

```sql
-- Get Dallas city ID
DO $$
DECLARE
  dallas_id uuid;
BEGIN
  SELECT id INTO dallas_id FROM public.cities WHERE slug = 'dallas';

  -- Insert test venue
  INSERT INTO public.venues (
    city_id,
    name,
    slug,
    address,
    lat,
    lng,
    type,
    description,
    amenities,
    status
  ) VALUES (
    dallas_id,
    'Perot Museum of Nature and Science',
    'perot-museum',
    '2201 N Field St, Dallas, TX 75201',
    32.7868,
    -96.8069,
    'museum',
    'Interactive science museum with sensory-friendly hours',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false}'::jsonb,
    'active'
  );
END $$;
```

## 5. Domain Setup (Optional)

### Add Custom Domain

1. In Vercel project settings → Domains
2. Add your domain (e.g., `findabacare.com`)
3. Configure DNS records as instructed
4. Wait for SSL certificate to provision

### Update Supabase Redirect URLs

1. Go to Supabase → Authentication → URL Configuration
2. Add your production domain to **Site URL**
3. Add to **Redirect URLs**:
   - `https://yourdomain.com/**`
   - `https://*.vercel.app/**`

## 6. Monitoring & Maintenance

### Vercel Analytics

- Enable Analytics in Vercel project settings
- Monitor page views, performance, and errors

### Supabase Database

- Monitor database size in Supabase dashboard
- Set up database backups (automatic in Supabase)
- Review logs for errors

### API Rate Limits

If using Upstash Redis:
- Monitor rate limit hits in Upstash dashboard
- Adjust limits in `src/lib/rateLimit.ts` as needed

## 7. Common Issues

### Build Failures

**Error: Missing environment variables**
- Solution: Ensure all required env vars are set in Vercel

**Error: Module not found**
- Solution: Run `pnpm install` locally to verify dependencies
- Check that `package.json` is committed

### Runtime Errors

**Error: Supabase connection failed**
- Solution: Verify SUPABASE_URL and keys are correct
- Check Supabase project is not paused

**Error: Map not loading**
- Solution: Verify PUBLIC_MAPBOX_TOKEN is set
- Check token has correct permissions

### Authentication Issues

**Magic link emails not sending**
- Solution: Configure Resend API key
- Verify email templates in Supabase

## 8. Scaling Considerations

### Database

- Supabase Free tier: 500MB storage, 50GB bandwidth
- Upgrade to Pro for production workloads
- Add database indexes as data grows

### Vercel

- Free tier: 100GB bandwidth
- Upgrade to Pro for custom domains and analytics
- Consider using Edge Functions for better performance

### Caching

- API responses have cache headers configured
- Consider adding CDN (Cloudflare) for static assets

## Next Steps

1. ✅ Deploy schema to Supabase
2. ✅ Configure environment variables in Vercel
3. ✅ Deploy to Vercel
4. ⏳ Add initial venue data
5. ⏳ Test all features in production
6. ⏳ Set up custom domain
7. ⏳ Enable monitoring and analytics

## Support

For issues or questions:
- Check GitHub Issues: https://github.com/ezhulati/FindABACare/issues
- Review Astro docs: https://docs.astro.build
- Review Supabase docs: https://supabase.com/docs
- Review Vercel docs: https://vercel.com/docs
