import type { APIRoute } from 'astro';

/**
 * Cron Job: Sync events from partner sources
 * Runs daily via Vercel Cron
 * Protected by Authorization header
 *
 * This endpoint triggers the maintain-events script which:
 * - Scrapes events from Finding Y'all
 * - Scrapes events from Eventbrite
 * - Removes past events
 * - Updates partner event sync timestamps
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

  const startTime = Date.now();

  try {
    console.log('🔧 Starting event sync cron job...');

    // Dynamic import to avoid bundling issues
    const { maintainEvents } = await import('../../../../scripts/maintain-events.js');

    // Run the maintenance script
    const stats = await maintainEvents();

    const duration = Date.now() - startTime;
    const hasErrors = stats.errors.length > 0;

    console.log(`✅ Event sync completed in ${duration}ms`);

    // Return detailed stats
    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: hasErrors
          ? 'Event sync completed with errors'
          : 'Event sync completed successfully',
        stats: {
          findingYallEvents: stats.findingYallEvents,
          eventbriteEvents: stats.eventbriteEvents,
          pastEventsRemoved: stats.pastEventsRemoved,
          eventsUpdated: stats.eventsUpdated,
          errorCount: stats.errors.length,
        },
        errors: stats.errors,
        timestamp: new Date().toISOString(),
        durationMs: duration,
      }),
      {
        status: hasErrors ? 207 : 200, // 207 Multi-Status if there are errors
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('❌ Event sync cron job failed:', err);

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Event sync failed',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString(),
        durationMs: duration,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
