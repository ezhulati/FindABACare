#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkVenue() {
  const { data } = await supabase
    .from('venues')
    .select('id, name, slug, photo_keys')
    .ilike('name', '%&MORE%')
    .limit(1)
    .single();

  if (data) {
    console.log('Venue:', data.name);
    console.log('Slug:', data.slug);
    console.log('Photo keys:', JSON.stringify(data.photo_keys, null, 2));
  } else {
    console.log('Venue not found');
  }
}

checkVenue();
