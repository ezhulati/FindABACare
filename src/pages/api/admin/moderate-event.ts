import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../lib/supabaseServer';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const data = await request.json();

    // Validate required fields
    if (!data.eventId || !data.action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId and action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate action type
    if (!['approve', 'reject'].includes(data.action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "approve" or "reject"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if event exists
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, title, admin_notes')
      .eq('id', data.eventId)
      .single();

    if (fetchError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data based on action
    let updateData: any = {};

    if (data.action === 'approve') {
      updateData = {
        approval_status: 'approved',
        status: 'published',
        approved_at: new Date().toISOString(),
      };
    } else if (data.action === 'reject') {
      // Append rejection reason to admin_notes
      const rejectionNote = data.reason
        ? `\n\nRejected: ${data.reason} (${new Date().toLocaleDateString()})`
        : `\n\nRejected on ${new Date().toLocaleDateString()}`;

      updateData = {
        approval_status: 'rejected',
        status: 'draft',
        admin_notes: (event.admin_notes || '') + rejectionNote,
      };
    }

    // Update the event
    const { error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', data.eventId);

    if (updateError) {
      console.error('Event moderation error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update event' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send email notification to submitter
    // Extract email from admin_notes and send notification

    return new Response(
      JSON.stringify({
        success: true,
        message: `Event ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderate event error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
