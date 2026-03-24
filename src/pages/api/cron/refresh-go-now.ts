import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { goNow } from '../../../lib/goNow';

/**
 * Cron Job: Refresh Go Now meter cache for all active venues
 * Runs every 15 minutes via Vercel Cron
 * Protected by Authorization header
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const vercelCronHeader = request.headers.get('x-vercel-cron-auth-token');

  const isAuthorized =
    (authHeader === `Bearer ${cronSecret}`) ||
    (vercelCronHeader === cronSecret);

  if (!cronSecret || !isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Create Supabase client with service role key for cron jobs
    const supabase = createClient(
      import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '',
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Fetch all active venues
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, type')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching venues:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!venues || venues.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No venues to process', count: 0 }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate meter for each venue and prepare upsert data
    const now = new Date();
    const updates = venues.map((venue) => ({
      venue_id: venue.id,
      meter: goNow(venue.type, now),
      updated_at: now.toISOString(),
    }));

    // Upsert to gonow_cache
    const { error: upsertError } = await supabase
      .from('gonow_cache')
      .upsert(updates, { onConflict: 'venue_id' });

    if (upsertError) {
      console.error('Error upserting Go Now cache:', upsertError);
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Refreshed Go Now meter for ${updates.length} venues`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Refreshed Go Now meter for ${updates.length} venues`,
        count: updates.length,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Cron job error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
