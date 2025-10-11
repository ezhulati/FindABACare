/**
 * SMS service using Twilio
 * Handles RSVP reminders and notifications
 */

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const accountSid = import.meta.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = import.meta.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured. SMS not sent.');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const formData = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('SMS send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS send exception:', error);
    return false;
  }
}

/**
 * SMS message templates
 */

export function rsvpConfirmationSMS(data: {
  eventTitle: string;
  venueName: string;
  date: string;
  time: string;
}): string {
  return `findABA.care: You're confirmed for "${data.eventTitle}" at ${data.venueName} on ${data.date} at ${data.time}. See you there!`;
}

export function rsvpReminderSMS(data: {
  eventTitle: string;
  venueName: string;
  time: string;
  hoursUntil: number;
}): string {
  const timing = data.hoursUntil === 24 ? 'tomorrow' : `in ${data.hoursUntil} hours`;
  return `findABA.care Reminder: "${data.eventTitle}" at ${data.venueName} is ${timing} (${data.time}). Looking forward to seeing you!`;
}

export function eventCancellationSMS(data: {
  eventTitle: string;
  reason?: string;
}): string {
  const reasonText = data.reason ? ` Reason: ${data.reason}` : '';
  return `findABA.care: Unfortunately, "${data.eventTitle}" has been cancelled.${reasonText} We apologize for any inconvenience.`;
}
