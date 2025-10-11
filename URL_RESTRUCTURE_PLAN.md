# URL Structure Restructure - findABA.care

## Current Status
✅ Created state archive page: `[state].astro`
✅ Created new city page: `[state]/[city].astro`
⏳ Need to complete implementation

## Why This Change?

### SEO Benefits
- **Better geographic hierarchy**: Google understands `/tx/dallas` > `/dallas`
- **Scalability**: Easy to add more states (CA, NY, FL, etc.)
- **State-level pages**: Archive pages showing all cities in a state
- **Proper breadcrumbs**: Home > Texas > Dallas
- **Internal linking**: Better site structure and link equity

### New URL Structure

**Before:**
```
/dallas
/dallas/events
/houston
/houston/events
```

**After:**
```
/tx                    ← New! State archive page
/tx/dallas            ← City page
/tx/dallas/events     ← Events page
/tx/houston
/tx/houston/events
```

## What's Been Created

### 1. State Archive Page (`[state].astro`)
- Shows all cities in that state
- Displays venue counts per city
- State-level statistics
- Links to each city
- Example: `/tx` shows Dallas and Houston

### 2. Updated City Page (`[state]/[city].astro`)
- Now includes state in URL
- Updated breadcrumbs: Home > Texas > Dallas
- Validates both state and city
- Falls back to state page if city not found

## What Still Needs To Be Done

### 1. Database Schema Update ⚠️ REQUIRED

Add `state` column to `cities` table:

```sql
-- Add state column to cities table
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'TX';

-- Add constraint to validate state codes
ALTER TABLE public.cities
ADD CONSTRAINT valid_state CHECK (state IN ('TX', 'CA', 'NY', 'FL', 'IL', 'PA', 'AZ', 'GA', 'NC', 'MI'));

-- Update existing cities
UPDATE public.cities SET state = 'TX' WHERE slug IN ('dallas', 'houston');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cities_state ON public.cities(state);
```

### 2. Create Events Page (`[state]/[city]/events.astro`)

Copy the existing `[city]/events.astro` and update:
- Change imports to `'../../../'` instead of `'../../'`
- Add state parameter validation
- Update breadcrumbs to include state
- Update all internal links

### 3. Update All Internal Links

Files that need link updates:
- `src/layouts/Base.astro` - Navigation links
- `src/pages/index.astro` - City cards
- `src/pages/about.astro` - Any city links
- `src/components/VenueCard.astro` - Venue links
- All other pages with city/venue links

### 4. Create URL Redirects

Add these redirect routes to handle old URLs:

**`src/pages/dallas.astro`** (Redirect):
```astro
---
return Astro.redirect('/tx/dallas', 301);
---
```

**`src/pages/houston.astro`** (Redirect):
```astro
---
return Astro.redirect('/tx/houston', 301);
---
```

**`src/pages/dallas/events.astro`** (Redirect):
```astro
---
return Astro.redirect('/tx/dallas/events', 301);
---
```

**`src/pages/houston/events.astro`** (Redirect):
```astro
---
return Astro.redirect('/tx/houston/events', 301);
---
```

### 5. Update Seed Data

Update `supabase/seed_venues.sql` to use the new state column when fetching cities.

## Implementation Steps

### Step 1: Update Database (DO THIS FIRST!)

1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new
2. Run the SQL from section "Database Schema Update" above
3. Verify cities now have state column

### Step 2: Update Homepage Links

In `src/pages/index.astro`, change:
```astro
<!-- From -->
<a href="/dallas">Dallas</a>
<a href="/houston">Houston</a>

<!-- To -->
<a href="/tx/dallas">Dallas</a>
<a href="/tx/houston">Houston</a>
```

### Step 3: Update Navigation

In `src/layouts/Base.astro`, change:
```astro
<!-- From -->
<a href="/dallas">Dallas</a>
<a href="/houston">Houston</a>

<!-- To -->
<a href="/tx/dallas">Dallas</a>
<a href="/tx/houston">Houston</a>
```

### Step 4: Create Redirects

Create the 4 redirect files listed in section #4 above.

### Step 5: Test

1. Visit `/tx` - should show state page with 2 cities
2. Visit `/tx/dallas` - should show Dallas venues
3. Visit `/dallas` - should redirect to `/tx/dallas`
4. Check all internal links work

## Benefits After Implementation

✅ **SEO**: Better geographic targeting
✅ **UX**: Clear breadcrumb navigation
✅ **Scalability**: Easy to add new states
✅ **Architecture**: Proper URL taxonomy
✅ **Internal linking**: State pages link to all cities
✅ **Future-proof**: Ready for national expansion

## Testing Checklist

- [ ] Database updated with state column
- [ ] `/tx` shows both cities
- [ ] `/tx/dallas` works
- [ ] `/tx/houston` works
- [ ] Old URLs redirect properly
- [ ] Breadcrumbs show: Home > Texas > Dallas
- [ ] All venue links work
- [ ] Events pages work
- [ ] Navigation links updated
- [ ] Run full build locally
- [ ] Deploy and test on production

## Questions?

This is a significant change but worth it for proper SEO and site structure. The state pages will also help with:
- **Internal linking**: Each state page links to its cities
- **Content organization**: Clear geographic hierarchy
- **Future growth**: Easy to add CA, NY, FL, etc.

Would you like me to complete this implementation?
