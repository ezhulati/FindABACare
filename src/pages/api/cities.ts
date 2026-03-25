import type { APIRoute } from 'astro';
import { getServerClient } from '../../lib/supabaseServer';
import { rateLimitMiddleware } from '../../lib/rateLimit';

export const GET: APIRoute = async ({ request }) => {
  const rateLimitResponse = await rateLimitMiddleware(request, 120, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = getServerClient(request);

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, details: error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ cities: data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
