import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEvents() {
  // Get all events (can't filter by time easily due to schema)
  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_type, source_name, date, start_time, approval_status')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== UPCOMING EVENTS ===');
  console.log('Total:', data?.length || 0);
  console.log('\nEvents by Type:');

  const byType = data?.reduce((acc, event) => {
    const type = event.event_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(byType);

  console.log('\nEvents by Source:');
  const bySource = data?.reduce((acc, event) => {
    const source = event.source_name || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(bySource);

  console.log('\nAll Events:');
  data?.forEach(event => {
    console.log(`- ${event.title} (${event.event_type}, ${event.source_name || 'N/A'}) - ${event.date} @ ${event.start_time}`);
  });
}

checkEvents();
