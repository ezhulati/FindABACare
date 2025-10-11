/**
 * Astro middleware for route protection
 * Handles authentication and role-based access control
 */

import { defineMiddleware } from 'astro:middleware';
import { getServerClient } from './lib/supabaseServer';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, redirect } = context;

  // Admin routes require authentication and admin role
  if (url.pathname.startsWith('/admin')) {
    const supabase = getServerClient(request);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Not authenticated - redirect to login
      return redirect('/?login=required&redirect=' + encodeURIComponent(url.pathname));
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Not authorized - redirect to home with error
      return redirect('/?error=unauthorized');
    }

    // Admin authenticated - allow request
    return next();
  }

  // All other routes pass through
  return next();
});
