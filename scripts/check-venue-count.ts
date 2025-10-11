import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://gvfkyfzukwnjomksuvaq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get Dallas city ID
  const { data: dallas } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'dallas')
    .single();

  // Count Dallas venues
  const { count: dallasCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', dallas?.id);

  console.log('✅ Dallas venues in database:', dallasCount);

  // Get Houston city ID
  const { data: houston } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'houston')
    .single();

  // Count Houston venues
  const { count: houstonCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', houston?.id);

  console.log('✅ Houston venues in database:', houstonCount);
  console.log('\n📊 Total venues:', (dallasCount || 0) + (houstonCount || 0));
}

main();
