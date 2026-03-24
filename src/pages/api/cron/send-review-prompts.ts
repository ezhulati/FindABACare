import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, reviewRequestEmail } from '../../../lib/email';
import dayjs from 'dayjs';

/**
 * Cron Job: Send review prompts to attendees
 * Sends review requests 4 hours after event ends
 * Runs every hour via Vercel Cron
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret
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
    const supabase = createClient(
      import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '',
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const now = dayjs();
    const fourHoursAgo = now.subtract(4, 'hours');

    // Find events that ended approximately 4 hours ago (with 30 min window)
    const { data: recentEvents } = await supabase
      .from('events')
      .select('*, venue:venues(name, slug), rsvps:rsvps(*, profile:profiles(display_name, email))')
      .eq('status', 'published')
      .gte('date', fourHoursAgo.subtract(15, 'minutes').format('YYYY-MM-DD'))
      .lte('date', fourHoursAgo.add(15, 'minutes').format('YYYY-MM-DD'));

    let promptsSent = 0;
    let errors = 0;

    if (recentEvents && recentEvents.length > 0) {
      for (const event of recentEvents) {
        if (!event.rsvps || event.rsvps.length === 0) continue;

        for (const rsvp of recentEvents) {
          if (rsvp.status !== 'confirmed' || !rsvp.profile?.email) continue;

          // Check if we already sent a review prompt for this RSVP
          const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('venue_id', event.venue_id)
            .eq('profile_id', rsvp.profile_id)
            .single();

          // Skip if user already reviewed this venue
          if (existingReview) continue;

          const reviewUrl = `${import.meta.env.PUBLIC_SITE_URL || 'https://autism.place'}/venue/${event.venue?.slug}?review=true`;

          try {
            await sendEmail({
              to: rsvp.profile.email,
              subject: 'How was your visit?',
              html: reviewRequestEmail({
                venueName: event.venue?.name || '',
                reviewUrl,
              }),
            });
            promptsSent++;
          } catch (err) {
            console.error('Email error:', err);
            errors++;
          }
        }
      }
    }

    console.log(`✅ Sent ${promptsSent} review prompts (${errors} errors)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${promptsSent} review prompts`,
        eventsProcessed: recentEvents?.length || 0,
        promptsSent,
        errors,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Review prompt cron error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
