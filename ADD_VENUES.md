# Add Venues to findABA.care

Your Dallas and Houston city pages are empty because no venues have been added yet. Here's how to add 10 sample venues:

## Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

## Step 2: Copy and Run the SQL

Copy the **entire contents** of `supabase/seed_venues.sql` and paste it into the SQL Editor.

Click **RUN** (bottom right button).

## Step 3: Verify

You should see: "Successfully inserted 10 venues (5 Dallas, 5 Houston)"

## Step 4: Check Your Site

Visit:
- https://findaba.care/dallas - Should now show 5 venues
- https://findaba.care/houston - Should now show 5 venues

## What Venues Are Being Added?

### Dallas (5 venues):
1. **Perot Museum of Nature and Science** - Museum with sensory-friendly hours
2. **Dallas Arboretum and Botanical Garden** - Outdoor gardens
3. **Dallas Zoo** - Family-friendly zoo with sensory bags
4. **Klyde Warren Park** - Urban park with playground
5. **Dallas Public Library - Downtown** - Library with sensory story times

### Houston (5 venues):
1. **Space Center Houston** - NASA visitor center
2. **Houston Zoo** - Large zoo with sensory maps
3. **Houston Museum of Natural Science** - Interactive exhibits
4. **Discovery Green** - Downtown park
5. **Children's Museum Houston** - Hands-on museum

All venues include:
- Real addresses and GPS coordinates
- Amenities (quiet rooms, visual supports, etc.)
- Sensory-friendly hours where applicable
- Go Now meter status (Quiet/Moderate/Busy)

---

**Need to add more venues later?**

You can use the same SQL pattern. Just copy one of the INSERT statements and modify the details.
