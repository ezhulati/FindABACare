/**
 * Client-side Supabase Auth helpers
 * For use in browser/islands
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabaseClient = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Authenticated fetch wrapper for client-side API calls
 * Automatically attaches JWT token to requests
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabaseClient.auth.getSession();

  const headers = new Headers(init.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(input, { ...init, headers });
}

/**
 * Sign in with email OTP
 */
export async function signInWithEmail(email: string) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (session: any) => void) {
  return supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
