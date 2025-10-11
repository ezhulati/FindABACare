/**
 * Email service using Resend
 * Handles all transactional emails for findABA.care
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured. Email not sent.');
    return false;
  }

  const from = options.from || import.meta.env.EMAIL_FROM || process.env.EMAIL_FROM || 'hello@findabacare.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Email send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send exception:', error);
    return false;
  }
}

/**
 * Email templates
 */

export function rsvpConfirmationEmail(data: {
  eventTitle: string;
  venueName: string;
  date: string;
  time: string;
  address: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .event-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>findABA.care</h1>
          </div>
          <div class="content">
            <h2>You're all set!</h2>
            <p>Your RSVP has been confirmed for:</p>

            <div class="event-details">
              <div class="detail-row">
                <span class="label">Event:</span> ${data.eventTitle}
              </div>
              <div class="detail-row">
                <span class="label">Venue:</span> ${data.venueName}
              </div>
              <div class="detail-row">
                <span class="label">Date:</span> ${data.date}
              </div>
              <div class="detail-row">
                <span class="label">Time:</span> ${data.time}
              </div>
              <div class="detail-row">
                <span class="label">Address:</span> ${data.address}
              </div>
            </div>

            <p><strong>What to expect:</strong></p>
            <ul>
              <li>We'll send you a reminder 24 hours before</li>
              <li>And another reminder 2 hours before</li>
              <li>Bring any sensory items your child may need</li>
              <li>Arrive 5-10 minutes early for a calm entry</li>
            </ul>

            <p>See you there! 👋</p>
          </div>
          <div class="footer">
            <p>findABA.care - Supporting families, one outing at a time</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function rsvpReminderEmail(data: {
  eventTitle: string;
  venueName: string;
  time: string;
  hoursUntil: number;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reminder: ${data.eventTitle}</h2>
          <p>This is a friendly reminder that your event is coming up in ${data.hoursUntil} hours!</p>
          <p><strong>${data.venueName}</strong><br>
          ${data.time}</p>
          <p>See you soon!</p>
        </div>
      </body>
    </html>
  `;
}

export function reviewRequestEmail(data: {
  venueName: string;
  reviewUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>How was your visit?</h2>
          <p>Thank you for attending an event at <strong>${data.venueName}</strong>!</p>
          <p>Your feedback helps other families know what to expect. Would you take 60 seconds to share your experience?</p>
          <p><a href="${data.reviewUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Leave a Review</a></p>
          <p>Thank you for being part of our community! 💙</p>
        </div>
      </body>
    </html>
  `;
}
