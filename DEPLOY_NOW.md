# Deploy findABA.care - Copy/Paste Instructions

## Part 1: Supabase Database (5 minutes)

### Step 1.1: Deploy Schema

1. Open this link: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

2. Copy the ENTIRE contents of `supabase/schema.sql` (all 247 lines)

3. Paste into the SQL Editor

4. Click **RUN** button (bottom right)

5. Wait for "Success. No rows returned" message

### Step 1.2: Deploy Seed Data

1. Click **New Query** button

2. Copy this SQL:

```sql
insert into public.cities (name, state, slug, center_lat, center_lng, status)
values
  ('Dallas', 'TX', 'dallas', 32.7767, -96.7970, 'active'),
  ('Houston', 'TX', 'houston', 29.7604, -95.3698, 'active')
on conflict (slug) do nothing;
```

3. Paste and click **RUN**

4. Should say "Success. 2 rows affected"

### Step 1.3: Get Supabase Keys

1. Open: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/settings/api

2. Copy these values (save in a text file):
   - Project URL: `https://gvfkyfzukwnjomksuvaq.supabase.co`
   - anon public key: (starts with `eyJ...`)

✅ **Database is ready!**

---

## Part 2: Get Mapbox Token (3 minutes)

1. Go to: https://account.mapbox.com/access-tokens/

2. If you don't have an account:
   - Sign up (free)
   - Verify email

3. Click **Create a token**

4. Settings:
   - Name: `findABA.care Production`
   - Leave all default scopes checked

5. Click **Create token**

6. Copy the token (starts with `pk.`)

✅ **Mapbox token ready!**

---

## Part 3: Deploy to Vercel (10 minutes)

### Step 3.1: Create Project

1. Go to: https://vercel.com/new

2. Sign in with GitHub (if not already)

3. Find repository: `ezhulati/findABA.care`

4. Click **Import**

### Step 3.2: Configure Build Settings

Vercel should auto-detect:
- Framework Preset: **Astro**
- Build Command: `pnpm build`
- Output Directory: `dist`

Leave these as-is.

### Step 3.3: Add Environment Variables

**IMPORTANT**: Add these BEFORE clicking Deploy!

Click **Environment Variables** dropdown, then add each one:

```
Name: SUPABASE_URL
Value: https://gvfkyfzukwnjomksuvaq.supabase.co
```

```
Name: SUPABASE_ANON_KEY
Value: [paste your Supabase anon key]
```

```
Name: PUBLIC_SUPABASE_URL
Value: https://gvfkyfzukwnjomksuvaq.supabase.co
```

```
Name: PUBLIC_SUPABASE_ANON_KEY
Value: [paste same Supabase anon key]
```

```
Name: PUBLIC_MAPBOX_TOKEN
Value: [paste your Mapbox token]
```

### Step 3.4: Deploy

1. Click **Deploy** button

2. Wait 2-3 minutes

3. You'll see:
   - Building... (yellow)
   - Then: Ready (green checkmark)

4. Click **Visit** to see your site!

✅ **Site is live!**

---

## Part 4: Test Your Site (3 minutes)

Your site URL will be something like: `https://find-aba-care-xyz.vercel.app`

### Test Checklist:

- [ ] Homepage loads with Dallas and Houston cards
- [ ] Click "Dallas" - city page loads
- [ ] Map appears on city page (Mapbox)
- [ ] Visit `/api/health` - shows `{"status":"ok"}`
- [ ] Click "Sign in" - email form appears
- [ ] Navigation menu works
- [ ] Footer links work

If all checks pass: **🎉 YOU'RE DEPLOYED!**

---

## Part 5: Add Test Venue (Optional - 2 minutes)

Want to see a real venue?

1. Go back to Supabase SQL Editor: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

2. Click **New Query**

3. Copy and paste:

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

4. Click **RUN**

5. Refresh your Dallas page - you should see the Perot Museum!

---

## Part 6: Enable Email (Optional - when you have Resend key)

When you get your Resend API key:

1. Go to Vercel project: https://vercel.com/[your-username]/findabacare

2. Click **Settings** → **Environment Variables**

3. Add:
   ```
   Name: RESEND_API_KEY
   Value: [your Resend key]
   ```

   ```
   Name: RESEND_FROM_EMAIL
   Value: noreply@yourdomain.com
   ```

4. Click **Save**

5. Go to **Deployments** tab → Click **...** on latest → **Redeploy**

---

## Troubleshooting

**Build fails on Vercel:**
- Check environment variables are all added
- Check for typos in variable names
- Look at build logs for specific error

**Map doesn't load:**
- Verify PUBLIC_MAPBOX_TOKEN is set
- Check browser console for errors
- Make sure token starts with `pk.`

**Can't sign in:**
- Verify Supabase keys are correct
- Check Supabase project isn't paused
- Try different email

**"No venues found" on city pages:**
- This is normal! Add venues using Part 5 above

---

## What You Have Now

- ✅ Production website on Vercel
- ✅ Database on Supabase
- ✅ Cities: Dallas & Houston
- ✅ Authentication working
- ✅ Maps integrated
- ✅ API endpoints live

## Next Steps

1. Add more venues (use SQL INSERT like in Part 5)
2. Create events for venues
3. Get Resend API key for emails
4. Add custom domain in Vercel
5. Start inviting users!

---

**Need help?** Check the full guides:
- `DEPLOYMENT.md` - Complete documentation
- `PROJECT_STATUS.md` - What's included
