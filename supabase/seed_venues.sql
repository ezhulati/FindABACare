-- Seed Venues for findABA.care
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/sql/new

-- First, get city IDs
DO $$
DECLARE
  dallas_id uuid;
  houston_id uuid;
BEGIN
  -- Get city IDs
  SELECT id INTO dallas_id FROM public.cities WHERE slug = 'dallas';
  SELECT id INTO houston_id FROM public.cities WHERE slug = 'houston';

  -- Dallas Venues
  INSERT INTO public.venues (
    city_id, name, slug, address, lat, lng, type, description,
    amenities, meter, status, sensory_hours
  ) VALUES
  (
    dallas_id,
    'Perot Museum of Nature and Science',
    'perot-museum',
    '2201 N Field St, Dallas, TX 75201',
    32.7868, -96.8069,
    'museum',
    'Interactive science museum with sensory-friendly hours on first Sunday of each month. Lower lighting, reduced sound, and quiet spaces available.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Moderate',
    'active',
    '[{"day": "First Sunday", "start_time": "10:00", "end_time": "12:00", "description": "Sensory-Friendly Morning"}]'::jsonb
  ),
  (
    dallas_id,
    'Dallas Arboretum and Botanical Garden',
    'dallas-arboretum',
    '8525 Garland Rd, Dallas, TX 75218',
    32.8223, -96.7160,
    'outdoor',
    'Beautiful outdoor gardens with wide pathways, quiet zones, and sensory gardens. Open spaces allow for movement and exploration.',
    '{"quiet_room": false, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true}'::jsonb,
    'Quiet',
    'active',
    '[]'::jsonb
  ),
  (
    dallas_id,
    'Dallas Zoo',
    'dallas-zoo',
    '650 S R.L. Thornton Fwy, Dallas, TX 75203',
    32.7416, -96.8157,
    'zoo',
    'Family-friendly zoo with sensory bags available at guest services. Best visited early morning for quieter experience.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Busy',
    'active',
    '[{"day": "Tuesday-Thursday", "start_time": "09:00", "end_time": "11:00", "description": "Quieter morning hours"}]'::jsonb
  ),
  (
    dallas_id,
    'Klyde Warren Park',
    'klyde-warren-park',
    '2012 Woodall Rodgers Fwy, Dallas, TX 75201',
    32.7895, -96.8010,
    'park',
    'Urban park with food trucks, performance pavilion, and open green spaces. Children''s area with water features and playground.',
    '{"quiet_room": false, "visual_supports": false, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Moderate',
    'active',
    '[]'::jsonb
  ),
  (
    dallas_id,
    'Dallas Public Library - Downtown',
    'dallas-library-downtown',
    '1515 Young St, Dallas, TX 75201',
    32.7826, -96.7974,
    'library',
    'Modern library with quiet reading areas and children''s section. Sensory story times on Saturday mornings.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": true, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Quiet',
    'active',
    '[{"day": "Saturday", "start_time": "10:00", "end_time": "11:00", "description": "Sensory-Friendly Story Time"}]'::jsonb
  );

  -- Houston Venues
  INSERT INTO public.venues (
    city_id, name, slug, address, lat, lng, type, description,
    amenities, meter, status, sensory_hours
  ) VALUES
  (
    houston_id,
    'Space Center Houston',
    'space-center-houston',
    '1601 E NASA Pkwy, Houston, TX 77058',
    29.5519, -95.0978,
    'museum',
    'NASA''s official visitor center with sensory-friendly mornings. Quiet zones and sensory bags available at admission desk.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Moderate',
    'active',
    '[{"day": "First Thursday", "start_time": "09:00", "end_time": "11:00", "description": "Sensory-Friendly Morning"}]'::jsonb
  ),
  (
    houston_id,
    'Houston Zoo',
    'houston-zoo',
    '6200 Hermann Park Dr, Houston, TX 77030',
    29.7152, -95.3905,
    'zoo',
    'Large zoo with shaded areas and water mist stations. Sensory maps available. Best visited on weekday mornings.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Busy',
    'active',
    '[{"day": "Monday-Friday", "start_time": "09:00", "end_time": "11:00", "description": "Quieter weekday mornings"}]'::jsonb
  ),
  (
    houston_id,
    'Houston Museum of Natural Science',
    'houston-museum-natural-science',
    '5555 Hermann Park Dr, Houston, TX 77030',
    29.7218, -95.3892,
    'museum',
    'Interactive exhibits including butterfly center and planetarium. Sensory-friendly events monthly.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": true, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Moderate',
    'active',
    '[{"day": "Second Sunday", "start_time": "09:00", "end_time": "12:00", "description": "Sensory-Friendly Morning"}]'::jsonb
  ),
  (
    houston_id,
    'Discovery Green',
    'discovery-green',
    '1500 McKinney St, Houston, TX 77010',
    29.7533, -95.3596,
    'park',
    'Downtown park with playground, splash pad, and open green spaces. Weekly family programs and quiet reading areas.',
    '{"quiet_room": false, "visual_supports": false, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Moderate',
    'active',
    '[]'::jsonb
  ),
  (
    houston_id,
    'Children''s Museum Houston',
    'childrens-museum-houston',
    '1500 Binz St, Houston, TX 77004',
    29.7229, -95.3853,
    'museum',
    'Hands-on children''s museum with 14 interactive exhibits. Sensory-friendly Sundays with reduced capacity and adjusted lighting.',
    '{"quiet_room": true, "visual_supports": true, "hand_dryer": false, "wheelchair_accessible": true, "changing_table": true}'::jsonb,
    'Busy',
    'active',
    '[{"day": "First Sunday", "start_time": "17:00", "end_time": "19:00", "description": "Sensory-Friendly Evening"}]'::jsonb
  );

  RAISE NOTICE 'Successfully inserted 10 venues (5 Dallas, 5 Houston)';
END $$;
