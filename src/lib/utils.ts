/**
 * Utility functions
 */

import dayjs from 'dayjs';

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: string = 'MMM D, YYYY'): string {
  return dayjs(date).format(format);
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  return dayjs(`2000-01-01 ${time}`).format('h:mm A');
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function timeAgo(date: string | Date): string {
  const now = dayjs();
  const then = dayjs(date);
  const diffMinutes = now.diff(then, 'minute');

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;

  const diffHours = now.diff(then, 'hour');
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;

  const diffDays = now.diff(then, 'day');
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  const diffMonths = now.diff(then, 'month');
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate calendar file (.ics) content
 */
export function generateICS(data: {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  url?: string;
}): string {
  const formatDateTimeForICS = (date: string, time: string) => {
    return dayjs(`${date} ${time}`).format('YYYYMMDDTHHmmss');
  };

  const start = formatDateTimeForICS(data.startDate, data.startTime);
  const end = formatDateTimeForICS(data.endDate, data.endTime);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//autism.place//Event Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@autism.place`,
    `DTSTAMP:${dayjs().format('YYYYMMDDTHHmmss')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${data.title}`,
    `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${data.location}`,
    data.url ? `URL:${data.url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Get hours until a datetime
 */
export function hoursUntil(date: string, time: string): number {
  const target = dayjs(`${date} ${time}`);
  const now = dayjs();
  return Math.max(0, target.diff(now, 'hour'));
}
