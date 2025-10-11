import type { APIRoute} from 'astro';
import { getServerClient, getAuthUser } from '../../lib/supabaseServer';
import { rateLimit } from '../../lib/rateLimit';
import { z } from 'zod';

const ReportSchema = z.object({
  venue_id: z.string().uuid().optional(),
  incident_type: z.string().min(1),
  description: z.string().min(10).max(2000),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
});

/**
 * Create incident report
 * POST /api/report
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Require authentication
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting - 10 reports per day per user
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `report:${user.id}:${clientIP}`;
    const allowed = await rateLimit(rateLimitKey, 10, 86400); // 10 per 24 hours

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again tomorrow.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = ReportSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { venue_id, incident_type, description, severity } = validation.data;

    const supabase = getServerClient(request);

    // If venue_id provided, verify it exists
    if (venue_id) {
      const { data: venue } = await supabase
        .from('venues')
        .select('id')
        .eq('id', venue_id)
        .single();

      if (!venue) {
        return new Response(
          JSON.stringify({ error: 'Venue not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Create incident report
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        venue_id,
        profile_id: user.id,
        incident_type,
        description,
        severity,
        status: 'open',
      })
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

    // TODO: Send notification to admin team for high severity incidents
    if (severity === 'high') {
      console.warn(`🚨 High severity incident reported: ${incident.id}`);
      // Could send email/SMS alert to admin team here
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident,
        message: 'Thank you for your report. Our team will review it shortly.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Incident report error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
