/**
 * Server-side Supabase client with SSR support
 * Use this for API routes and server-side rendering
 */

import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function getServerClient(request: Request) {
  // In Vercel serverless, use process.env directly
  const supabaseUrl =
    process.env.PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    import.meta.env.PUBLIC_SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    '';

  // Add error logging for debugging
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => {
          const cookie = request.headers.get('cookie') || '';
          const match = cookie.match(new RegExp(`${key}=([^;]+)`));
          return match ? decodeURIComponent(match[1]) : undefined;
        },
        set: () => {
          // Cookies are set on the response, not here
        },
        remove: () => {
          // Cookies are removed on the response, not here
        },
      },
    }
  );

  return supabase;
}

/**
 * Get authenticated user from server-side request
 */
export async function getAuthUser(request: Request) {
  const supabase = getServerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user profile from database
 */
export async function getUserProfile(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return null;

  const supabase = getServerClient(request);
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user', user.id)
    .single();

  return profile;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const profile = await getUserProfile(request);
  return profile?.role === 'admin';
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return user;
}

/**
 * Require admin role - throws 403 if not admin
 */
export async function requireAdmin(request: Request) {
  const admin = await isAdmin(request);
  if (!admin) {
    throw new Response('Forbidden', { status: 403 });
  }
}
