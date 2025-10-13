/**
 * Browser-side Supabase Client
 *
 * Properly configured to read/write auth cookies
 * Use this in all React components that need auth
 */

import { createBrowserClient } from '@supabase/ssr';

// Create a singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
        },
        set(name: string, value: string, options: any) {
          let cookieString = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          if (options?.secure) cookieString += '; secure';
          document.cookie = cookieString;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; max-age=0; path=${options?.path || '/'}`;
        },
      },
    }
  );

  return supabaseClient;
}
