import type { APIRoute } from 'astro';
import { getServerClient } from '../../../lib/supabaseServer';
import dayjs from 'dayjs';

/**
 * Generate iCal feed for city events
 * GET /api/[city]/calendar.ics
 */
export const GET: APIRoute = async ({ params, request }) => {
  const { city } = params;

  if (!city) {
    return new Response('City parameter required', { status: 400 });
  }

  try {
    const supabase = getServerClient(request);

    // Get city by slug
    const { data: cityData } = await supabase
      .from('cities')
      .select('id, name')
      .eq('slug', city)
      .single();

    if (!cityData) {
      return new Response('City not found', { status: 404 });
    }

    // Get upcoming published events for this city
    const { data: events } = await supabase
      .from('events')
      .select('*, venue:venues(name, address, lat, lng)')
      .eq('city_id', cityData.id)
      .eq('status', 'published')
      .gte('date', dayjs().format('YYYY-MM-DD'))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(100);

    if (!events || events.length === 0) {
      return new Response('No upcoming events found', { status: 404 });
    }

    // Generate iCal content
    const icalEvents = events
      .map((event) => {
        const startDateTime = dayjs(`${event.date}T${event.start_time}`);
        const endDateTime = dayjs(`${event.date}T${event.end_time}`);

        // Format dates for iCal (YYYYMMDDTHHmmss)
        const dtstart = startDateTime.format('YYYYMMDDTHHmmss');
        const dtend = endDateTime.format('YYYYMMDDTHHmmss');
        const dtstamp = dayjs().format('YYYYMMDDTHHmmss');

        // Escape special characters in description
        const description = (event.description || '')
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n');

        const location = event.venue?.address
          ? event.venue.address.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
          : '';

        return `BEGIN:VEVENT
UID:${event.id}@autism.place
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.title}
DESCRIPTION:${description}
LOCATION:${event.venue?.name ? `${event.venue.name}, ` : ''}${location}
URL:https://autism.place/venue/${event.venue_id}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
      })
      .join('\n');

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//autism.place//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:autism.place - ${cityData.name} Events
X-WR-TIMEZONE:America/Chicago
X-WR-CALDESC:Autism-friendly events and meetups in ${cityData.name}
${icalEvents}
END:VCALENDAR`;

    return new Response(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${city}-events.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (err: any) {
    console.error('iCal generation error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
