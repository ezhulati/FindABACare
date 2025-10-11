# Supabase Setup for findABA.care

## Your Project
**Project Name:** findABA.care
**Project ID:** gvfkyfzukwnjomksuvaq
**Region:** East US (North Virginia)

---

## Step 1: Get Your Credentials

1. Go to https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/settings/api
2. Copy the following values:

### Project URL
Found under "Project URL"
```
https://gvfkyfzukwnjomksuvaq.supabase.co
```

### Anon Key
Found under "Project API keys" → "anon public"
```
(Copy this value)
```

### Service Role Key (Optional - for admin operations)
Found under "Project API keys" → "service_role"
```
(Copy this value - keep it secret!)
```

---

## Step 2: Create .env File

Create a file named `.env` in the project root with:

```bash
# Supabase
SUPABASE_URL="https://gvfkyfzukwnjomksuvaq.supabase.co"
SUPABASE_ANON_KEY="paste-your-anon-key-here"
SUPABASE_SERVICE_ROLE="paste-your-service-role-key-here"

# Mapbox (get from https://account.mapbox.com/)
MAPBOX_TOKEN="pk.your-mapbox-token-here"

# Email (Resend - get from https://resend.com/api-keys)
RESEND_API_KEY="re_your-key-here"
EMAIL_FROM="hello@findabacare.com"

# SMS (Twilio - optional for MVP)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM_NUMBER=""

# Analytics (PostHog - optional)
POSTHOG_KEY=""
POSTHOG_HOST="https://us.i.posthog.com"

# Admin
ADMIN_BASIC_USER="admin"
ADMIN_BASIC_PASS="changeme123"

# Cron
CRON_TOKEN="generate-random-string-here"
```

---

## Step 3: Run Database Schema

1. Go to https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new
2. Copy the entire contents of `supabase/schema.sql`
3. Paste into the SQL Editor
4. Click "Run"
5. Wait for success message

---

## Step 4: Seed Initial Data

1. In the same SQL Editor
2. Copy the contents of `supabase/seed.sql`
3. Click "Run"
4. This will create Dallas and Houston cities

---

## Step 5: Enable Email Auth

1. Go to https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/auth/providers
2. Enable "Email" provider
3. Configure:
   - ✅ Enable Email provider
   - ✅ Confirm email (optional for MVP - can disable)
   - Site URL: `http://localhost:4321` (for development)

---

## Step 6: Test the Connection

Run the development server:

```bash
pnpm dev
```

Visit http://localhost:4321

The homepage should load without errors!

---

## Verification Checklist

- [ ] `.env` file created with Supabase credentials
- [ ] Database schema executed successfully
- [ ] Cities seeded (Dallas & Houston)
- [ ] Email auth enabled
- [ ] Dev server running without errors
- [ ] No console errors about missing environment variables

---

## Troubleshooting

### "Invalid API key" error
- Check that SUPABASE_ANON_KEY is correct
- Make sure there are no extra spaces or quotes

### "Failed to fetch" errors
- Verify SUPABASE_URL is correct
- Check that schema.sql ran successfully
- Ensure RLS policies are enabled

### Tables not found
- Re-run schema.sql in Supabase SQL Editor
- Check that you're connected to the correct project

---

## Next Steps

Once setup is complete, we'll move to Phase 2:
- Core library utilities (email, SMS helpers)
- Authentication helpers
- API routes
- UI components

---

**Need Help?** Check the Supabase documentation:
https://supabase.com/docs/guides/getting-started
