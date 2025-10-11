# URL Restructure - Staged Implementation Plan

## Current State

### What Exists Now:
✅ Old structure working: `/dallas`, `/houston`
✅ New state page created: `[state].astro`
✅ New city page created: `[state]/[city].astro`
❌ Database doesn't have state column yet
❌ Old pages still exist (will cause conflicts)
❌ Links still point to old URLs

### File Structure:
```
src/pages/
├── [city].astro                    ← OLD (needs removal)
├── [city]/events.astro             ← OLD (needs removal)
├── [state].astro                   ← NEW ✓
├── [state]/[city].astro            ← NEW ✓
└── [state]/[city]/events.astro     ← NEED TO CREATE
```

---

## Stage 1: Database Preparation (5 min)
**Goal:** Add state column to cities table

### What to Do:
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

2. Run this SQL:

```sql
-- Add state column to cities table
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS state TEXT;

-- Set default value for existing rows
UPDATE public.cities
SET state = 'TX'
WHERE state IS NULL;

-- Make it required for new rows
ALTER TABLE public.cities
ALTER COLUMN state SET NOT NULL;

-- Add check constraint for valid states
ALTER TABLE public.cities
ADD CONSTRAINT valid_state_code
CHECK (state IN ('TX', 'CA', 'NY', 'FL', 'IL', 'PA', 'AZ', 'GA', 'NC', 'MI'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cities_state
ON public.cities(state);

-- Verify the update
SELECT id, name, slug, state FROM public.cities;
```

### Expected Result:
```
 id   | name    | slug    | state
------+---------+---------+-------
 ... | Dallas  | dallas  | TX
 ... | Houston | houston | TX
```

### How to Verify:
```sql
-- This query should return 2 rows
SELECT COUNT(*) as texas_cities
FROM public.cities
WHERE state = 'TX';
```

**✓ Complete this stage before moving to Stage 2**

---

## Stage 2: Update Seed Data (3 min)
**Goal:** Fix the venue seed SQL to work with state column

### What to Do:
Update `supabase/seed_venues.sql`:

Change this line (around line 15):
```sql
-- FROM:
SELECT id INTO dallas_id FROM public.cities WHERE slug = 'dallas';
SELECT id INTO houston_id FROM public.cities WHERE slug = 'houston';

-- TO:
SELECT id INTO dallas_id FROM public.cities WHERE slug = 'dallas' AND state = 'TX';
SELECT id INTO houston_id FROM public.cities WHERE slug = 'houston' AND state = 'TX';
```

### Why:
- Future-proofs for when we might have multiple cities with same name
- Makes queries more specific
- Follows best practices

### Test:
After making this change, you can re-run the seed file to add venues (if you haven't already).

**✓ Complete this stage, then move to Stage 3**

---

## Stage 3: Create Events Page (5 min)
**Goal:** Create `/[state]/[city]/events.astro`

### Files to Create:
I'll create this file by copying the old one and updating:
- Import paths (add one more `../`)
- Add state validation
- Update breadcrumbs
- Update internal links

### What I'll Change:
```astro
// OLD: src/pages/[city]/events.astro
import Base from '../../layouts/Base.astro';
const { city } = Astro.params;

// NEW: src/pages/[state]/[city]/events.astro
import Base from '../../../layouts/Base.astro';
const { state, city } = Astro.params;
```

**✓ I'll handle this - you just need to approve**

---

## Stage 4: Update All Internal Links (10 min)
**Goal:** Change all links from `/dallas` to `/tx/dallas`

### Files to Update:

#### 1. **src/pages/index.astro** (Homepage)
Change city cards:
```astro
<!-- FROM -->
<a href="/dallas">

<!-- TO -->
<a href="/tx/dallas">
```

#### 2. **src/layouts/Base.astro** (Navigation)
Update navigation links:
```astro
<!-- FROM -->
<a href="/dallas">Dallas</a>
<a href="/houston">Houston</a>

<!-- TO -->
<a href="/tx/dallas">Dallas</a>
<a href="/tx/houston">Houston</a>
```

#### 3. **src/pages/about.astro**
Check for any city links and update them.

#### 4. **src/pages/venue/[slug].astro**
Update breadcrumbs and city links:
```astro
<!-- FROM -->
<a href={`/${venue.city?.slug}`}>

<!-- TO -->
<a href={`/tx/${venue.city?.slug}`}>
```

#### 5. **src/pages/first-visit-kit.astro**
Update any city links.

### How We'll Test:
```bash
# Search for old-style links
grep -r '"/dallas"' src/
grep -r '"/houston"' src/
grep -r 'href=.*/${city}' src/

# Should return very few or no results
```

**✓ I'll create a checklist of every link that needs updating**

---

## Stage 5: Create Redirects (5 min)
**Goal:** Redirect old URLs to new URLs with 301 (permanent redirect)

### Files to Create:

#### **src/pages/dallas.astro**
```astro
---
return Astro.redirect('/tx/dallas', 301);
---
```

#### **src/pages/houston.astro**
```astro
---
return Astro.redirect('/tx/houston', 301);
---
```

#### **src/pages/dallas/events.astro**
```astro
---
return Astro.redirect('/tx/dallas/events', 301);
---
```

#### **src/pages/houston/events.astro**
```astro
---
return Astro.redirect('/tx/houston/events', 301);
---
```

### Why 301 Redirects:
- Tells search engines "this page moved permanently"
- Passes SEO value from old URL to new URL
- Automatically updates bookmarks
- Maintains old links from other sites

**✓ Simple - I'll create these 4 tiny files**

---

## Stage 6: Delete Old Files (2 min)
**Goal:** Remove the old city pages to avoid conflicts

### Files to DELETE:
```
src/pages/[city].astro           ← DELETE
src/pages/[city]/events.astro    ← DELETE (after we create new one)
```

**⚠️ Important:** Only delete AFTER we've:
1. Created the new pages
2. Updated all links
3. Created redirects
4. Tested locally

---

## Stage 7: Local Testing (5 min)
**Goal:** Verify everything works locally

### Test Checklist:
```bash
# 1. Build the project
npm run dev

# 2. Test new URLs
✓ Visit http://localhost:4321/tx
✓ Visit http://localhost:4321/tx/dallas
✓ Visit http://localhost:4321/tx/houston
✓ Visit http://localhost:4321/tx/dallas/events

# 3. Test redirects
✓ Visit http://localhost:4321/dallas (should redirect to /tx/dallas)
✓ Visit http://localhost:4321/houston (should redirect to /tx/houston)

# 4. Test navigation
✓ Click navigation links - should go to /tx/dallas
✓ Click city cards on homepage - should go to /tx/dallas
✓ Click venue links - should work
✓ Check breadcrumbs show: Home > Texas > Dallas

# 5. Check for errors
✓ No 404 errors
✓ No broken links
✓ Map loads correctly
✓ Filters work
```

**✓ I'll provide exact commands to run**

---

## Stage 8: Deploy to Production (5 min)
**Goal:** Push changes to GitHub and deploy

### Steps:
```bash
# 1. Commit all changes
git add .
git commit -m "Restructure URLs to include state (/tx/dallas)"

# 2. Push to GitHub
git push origin main

# 3. Vercel deploys automatically

# 4. Test production
✓ Visit https://findaba.care/tx
✓ Visit https://findaba.care/tx/dallas
✓ Visit https://findaba.care/dallas (should redirect)
```

---

## Timeline

| Stage | Task | Time | Who |
|-------|------|------|-----|
| 1 | Database schema | 5 min | You (SQL) |
| 2 | Update seed data | 3 min | Me |
| 3 | Create events page | 5 min | Me |
| 4 | Update internal links | 10 min | Me |
| 5 | Create redirects | 5 min | Me |
| 6 | Delete old files | 2 min | Me |
| 7 | Local testing | 5 min | Both |
| 8 | Deploy | 5 min | Me |
| **Total** | | **40 min** | |

---

## Risk Mitigation

### What Could Go Wrong:
1. **Database update fails** → Rollback with `ALTER TABLE cities DROP COLUMN state;`
2. **Broken links** → We test locally first
3. **Redirects don't work** → Easy to fix, just update redirect files
4. **SEO impact** → 301 redirects preserve SEO value

### Safety Measures:
- ✅ Keep old files until redirects tested
- ✅ Test locally before deploying
- ✅ Use 301 redirects (not 302)
- ✅ Git commit after each stage
- ✅ Can rollback via Git if needed

---

## Decision Point

**You have 3 options:**

### Option A: Do All Stages Now (40 min)
- I'll complete stages 2-6
- You run the SQL in Stage 1
- We test together in Stage 7
- Deploy in Stage 8

### Option B: Do Stage 1 Only (5 min)
- You run the database SQL
- We verify it worked
- Pause and continue later

### Option C: Review More First
- Ask questions
- Adjust the plan
- Start when ready

**Which option would you like?**
