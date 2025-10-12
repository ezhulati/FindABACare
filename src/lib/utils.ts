/**
 * Utility functions
 */

import dayjs from 'dayjs';

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

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
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate average rating
 */
export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
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
    `UID:${Date.now()}@findabacare.com`,
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
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random string
 */
export function randomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if date is in the past
 */
export function isPast(date: string): boolean {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if date is today
 */
export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Get hours until a datetime
 */
export function hoursUntil(date: string, time: string): number {
  const target = dayjs(`${date} ${time}`);
  const now = dayjs();
  return Math.max(0, target.diff(now, 'hour'));
}
