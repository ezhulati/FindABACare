import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      eventTitle,
      eventDate,
      eventStartTime,
      eventEndTime,
      venueName,
      venueAddress,
    } = body;

    // Parse date and time
    const [year, month, day] = eventDate.split('-');
    const [startHour, startMinute] = eventStartTime.split(':');
    const [endHour, endMinute] = eventEndTime.split(':');

    // Create start and end datetime strings in iCalendar format (YYYYMMDDTHHMMSS)
    const startDateTime = `${year}${month}${day}T${startHour}${startMinute}00`;
    const endDateTime = `${year}${month}${day}T${endHour}${endMinute}00`;

    // Generate a unique ID for this event
    const uid = `${eventDate}-${eventStartTime}-${eventTitle.replace(/\s+/g, '-')}@autism.place`;

    // Current timestamp in iCalendar format
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

    // Build iCalendar file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//autism.place//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${eventTitle}`,
      `LOCATION:${venueName}, ${venueAddress}`,
      `DESCRIPTION:You're registered for ${eventTitle} at ${venueName}. We'll send you reminders 24 hours and 2 hours before the event.`,
      'STATUS:CONFIRMED',
      // Add reminders
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event tomorrow: ' + eventTitle,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event starting soon: ' + eventTitle,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Return the .ics file
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${eventTitle.replace(/\s+/g, '-')}.ics"`,
      },
    });
  } catch (error) {
    console.error('Calendar generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate calendar file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
