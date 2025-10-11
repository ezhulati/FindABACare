/**
 * Rate limiting using Upstash Redis
 * Protects API endpoints from abuse
 */

export async function rateLimit(
  key: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<boolean> {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis not configured. Rate limiting disabled.');
    return true; // Allow request if rate limiting not configured
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const bucketKey = `rl:${key}:${Math.floor(now / windowSec)}`;

    // Increment counter
    const incrRes = await fetch(`${url}/incr/${bucketKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const count = Number(await incrRes.text());

    // Set expiration on first request
    if (count === 1) {
      await fetch(`${url}/pexpire/${bucketKey}/${windowSec * 1000}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return count <= limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to avoid blocking legitimate traffic
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  limit: number = 60,
  windowSec: number = 60
): Promise<Response | null> {
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  const key = `${ip}:${path}`;

  const allowed = await rateLimit(key, limit, windowSec);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(windowSec),
        },
      }
    );
  }

  return null; // Allow request to proceed
}
