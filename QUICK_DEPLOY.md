# Quick Deploy to Vercel

Follow these steps to deploy findABA.care to Vercel in ~10 minutes.

## Step 1: Deploy Database Schema (5 min)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq)
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy entire contents of `supabase/schema.sql` and paste
5. Click **Run** (bottom right)
6. Wait for "Success" message
7. Create new query, copy `supabase/seed.sql`, click **Run**

✅ Database is ready!

## Step 2: Get Supabase API Keys (2 min)

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://gvfkyfzukwnjomksuvaq.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

Keep these for Step 4.

## Step 3: Get Mapbox Token (3 min)

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Click **Create a token**
3. Name it "findABA.care Production"
4. Leave default scopes
5. Click **Create token**
6. Copy the token (starts with `pk.`)

## Step 4: Deploy to Vercel (5 min)

### Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Add New Project**
3. Find and import: `ezhulati/findABA.care`
4. Vercel auto-detects Astro framework

### Add Environment Variables

Before deploying, click **Environment Variables** and add these:

**Required (app won't work without these):**

```
SUPABASE_URL = https://gvfkyfzukwnjomksuvaq.supabase.co
SUPABASE_ANON_KEY = [paste your anon key from Step 2]
PUBLIC_SUPABASE_URL = https://gvfkyfzukwnjomksuvaq.supabase.co
PUBLIC_SUPABASE_ANON_KEY = [paste your anon key from Step 2]
PUBLIC_MAPBOX_TOKEN = [paste your Mapbox token from Step 3]
```

**Optional (features will be disabled without these):**

```
RESEND_API_KEY = re_... (for email notifications)
RESEND_FROM_EMAIL = noreply@yourdomain.com
UPSTASH_REDIS_REST_URL = https://... (for rate limiting)
UPSTASH_REDIS_REST_TOKEN = ...
```

### Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Click the preview URL when ready

✅ App is deployed!

## Step 5: Test Your Deployment (2 min)

Visit your Vercel URL and check:

- ✅ Homepage loads with Dallas and Houston cards
- ✅ Click a city - should show "No venues found"
- ✅ Navigate to `/api/health` - should show `{"status":"ok"}`
- ✅ Try signing in with email (you'll get a magic link)

## What's Next?

### Add Test Venue (Optional)

To see the app with real data, run this in Supabase SQL Editor:

```sql
DO $$
DECLARE
  dallas_id uuid;
BEGIN
  SELECT id INTO dallas_id FROM public.cities WHERE slug = 'dallas';

  INSERT INTO public.venues (
    city_id, name, slug, address, lat, lng, type, description,
    amenities, status
  ) VALUES (
    dallas_id,
    'Perot Museum of Nature and Science',
    'perot-museum',
    '2201 N Field St, Dallas, TX 75201',
    32.7868, -96.8069,
    'museum',
    'Interactive science museum with sensory-friendly hours on first Sunday of each month',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false}'::jsonb,
    'active'
  );
END $$;
```

Refresh your city page - you should see the venue!

### Enable Email Notifications

1. Sign up at [Resend.com](https://resend.com)
2. Get API key
3. Add to Vercel environment variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
4. Redeploy

### Add Custom Domain

1. In Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `findabacare.com`)
3. Update DNS as instructed
4. Update Supabase redirect URLs:
   - Go to Supabase → **Authentication** → **URL Configuration**
   - Add `https://yourdomain.com/**` to allowed redirect URLs

## Troubleshooting

**"No venues found" on city pages**
- This is normal - add venues using the SQL above

**Sign-in not working**
- Check SUPABASE_URL and keys are correct in Vercel
- Verify Supabase project is not paused

**Map not loading**
- Verify PUBLIC_MAPBOX_TOKEN is set in Vercel
- Check browser console for errors

**API errors**
- Visit `/api/health` to verify server is running
- Check Vercel logs for errors

## Need Help?

- Full guide: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check [Vercel logs](https://vercel.com/docs/observability/runtime-logs)
- Review [Supabase logs](https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/logs/explorer)
