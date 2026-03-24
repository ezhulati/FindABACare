import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, rsvpReminderEmail } from '../../../lib/email';
import { sendSMS, rsvpReminderSMS } from '../../../lib/sms';
import dayjs from 'dayjs';

/**
 * Cron Job: Send RSVP reminders
 * Sends reminders 24 hours and 2 hours before events
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
    const in24Hours = now.add(24, 'hours');
    const in2Hours = now.add(2, 'hours');

    // Find events starting in 24 hours (with 30 min window)
    const { data: events24h } = await supabase
      .from('events')
      .select('*, venue:venues(name, address), rsvps:rsvps(*, profile:profiles(display_name, email, phone))')
      .eq('status', 'published')
      .gte('date', in24Hours.subtract(15, 'minutes').format('YYYY-MM-DD'))
      .lte('date', in24Hours.add(15, 'minutes').format('YYYY-MM-DD'));

    // Find events starting in 2 hours (with 30 min window)
    const { data: events2h } = await supabase
      .from('events')
      .select('*, venue:venues(name, address), rsvps:rsvps(*, profile:profiles(display_name, email, phone))')
      .eq('status', 'published')
      .gte('date', in2Hours.subtract(15, 'minutes').format('YYYY-MM-DD'))
      .lte('date', in2Hours.add(15, 'minutes').format('YYYY-MM-DD'));

    let remindersSent = 0;
    let errors = 0;

    // Send 24-hour reminders
    if (events24h && events24h.length > 0) {
      for (const event of events24h) {
        if (!event.rsvps || event.rsvps.length === 0) continue;

        for (const rsvp of event.rsvps) {
          if (rsvp.status !== 'confirmed' || !rsvp.profile) continue;

          const reminderData = {
            eventTitle: event.title,
            venueName: event.venue?.name || '',
            time: event.start_time,
            hoursUntil: 24,
          };

          // Send email
          if (rsvp.profile.email) {
            try {
              await sendEmail({
                to: rsvp.profile.email,
                subject: `Reminder: ${event.title} tomorrow`,
                html: rsvpReminderEmail(reminderData),
              });
              remindersSent++;
            } catch (err) {
              console.error('Email error:', err);
              errors++;
            }
          }

          // Send SMS if phone number available
          if (rsvp.profile.phone) {
            try {
              await sendSMS(
                rsvp.profile.phone,
                rsvpReminderSMS(reminderData)
              );
            } catch (err) {
              console.error('SMS error:', err);
            }
          }
        }
      }
    }

    // Send 2-hour reminders
    if (events2h && events2h.length > 0) {
      for (const event of events2h) {
        if (!event.rsvps || event.rsvps.length === 0) continue;

        for (const rsvp of event.rsvps) {
          if (rsvp.status !== 'confirmed' || !rsvp.profile) continue;

          const reminderData = {
            eventTitle: event.title,
            venueName: event.venue?.name || '',
            time: event.start_time,
            hoursUntil: 2,
          };

          // Send email
          if (rsvp.profile.email) {
            try {
              await sendEmail({
                to: rsvp.profile.email,
                subject: `Starting soon: ${event.title}`,
                html: rsvpReminderEmail(reminderData),
              });
              remindersSent++;
            } catch (err) {
              console.error('Email error:', err);
              errors++;
            }
          }

          // Send SMS
          if (rsvp.profile.phone) {
            try {
              await sendSMS(
                rsvp.profile.phone,
                rsvpReminderSMS(reminderData)
              );
            } catch (err) {
              console.error('SMS error:', err);
            }
          }
        }
      }
    }

    console.log(`✅ Sent ${remindersSent} RSVP reminders (${errors} errors)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${remindersSent} reminders`,
        events24h: events24h?.length || 0,
        events2h: events2h?.length || 0,
        remindersSent,
        errors,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('RSVP reminder cron error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
