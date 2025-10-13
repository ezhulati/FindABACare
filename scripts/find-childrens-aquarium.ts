import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gvfkyfzukwnjomksuvaq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zmt5Znp1a3duam9ta3N1dmFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE0NTQxNSwiZXhwIjoyMDc1NzIxNDE1fQ.oP1P1VSRRB_TCmEooniSoOmS-ey4oVf8aXAaADqo1F8'
);

async function findAquarium() {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, slug')
    .ilike('name', '%children%aquarium%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found venues:', JSON.stringify(data, null, 2));
}

findAquarium();
