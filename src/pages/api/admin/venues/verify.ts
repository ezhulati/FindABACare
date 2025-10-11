import type { APIRoute } from 'astro';
import { getServerClient, requireAdmin, getAuthUser } from '../../../../lib/supabaseServer';

/**
 * Admin API: Mark venue as verified
 * POST /api/admin/venues/verify
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { venue_id } = body;

    if (!venue_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getServerClient(request);

    // Update venue last_verified timestamp and verified_by
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .update({
        last_verified: new Date().toISOString(),
        verified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', venue_id)
      .select()
      .single();

    if (venueError) {
      return new Response(
        JSON.stringify({ error: venueError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark any open verification tasks as completed
    await supabase
      .from('verifications')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('venue_id', venue_id)
      .eq('status', 'open');

    return new Response(
      JSON.stringify({
        success: true,
        venue,
        message: 'Venue verified successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    if (err.status === 403) {
      return err;
    }

    console.error('Venue verification error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
