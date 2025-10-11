import type { APIRoute } from 'astro';
import { getServerClient, requireAdmin } from '../../../../lib/supabaseServer';

/**
 * Admin API: Update review status (approve/reject)
 * PATCH /api/admin/reviews/:id
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Review ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse body
    const body = await request.json();
    const { status } = body;

    if (!status || !['published', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be "published" or "rejected"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getServerClient(request);

    // Update review status
    const { data, error } = await supabase
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, review: data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    // Check if it's an authorization error
    if (err.status === 403) {
      return err;
    }

    console.error('Admin review update error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
