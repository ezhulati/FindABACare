/**
 * Rate limiting using Upstash Redis with in-memory fallback
 * Protects API endpoints from abuse
 */

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, { count: number; expires: number }>();

function memoryRateLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const bucketKey = `${key}:${Math.floor(now / 1000 / windowSec)}`;

  // Clean expired entries periodically
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore) {
      if (v.expires < now) memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(bucketKey);
  if (!entry || entry.expires < now) {
    memoryStore.set(bucketKey, { count: 1, expires: now + windowSec * 1000 });
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

export async function rateLimit(
  key: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<boolean> {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return memoryRateLimit(key, limit, windowSec);
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
    console.error('Rate limit check error, falling back to memory:', error);
    return memoryRateLimit(key, limit, windowSec);
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
