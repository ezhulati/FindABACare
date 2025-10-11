import type { APIRoute } from 'astro';
import { getServerClient } from '../lib/supabaseServer';

/**
 * Generate XML sitemap for SEO
 * Includes all public pages: cities, venues, events, static pages
 */
export const GET: APIRoute = async ({ request }) => {
  const supabase = getServerClient(request);
  const baseUrl = 'https://findabacare.com'; // Update with your production URL

  // Fetch all active cities
  const { data: cities } = await supabase
    .from('cities')
    .select('slug, state, updated_at')
    .eq('status', 'active')
    .order('name');

  // Fetch all active venues
  const { data: venues } = await supabase
    .from('venues')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  const now = new Date().toISOString();

  // Build sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- About Page -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Privacy Policy -->
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Terms of Service -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  ${cities && cities.length > 0
    ? cities
        .map(
          (city) => `
  <!-- City: ${city.slug} -->
  <url>
    <loc>${baseUrl}/${city.state?.toLowerCase()}/${city.slug}</loc>
    <lastmod>${city.updated_at || now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- City Events -->
  <url>
    <loc>${baseUrl}/${city.state?.toLowerCase()}/${city.slug}/events</loc>
    <lastmod>${city.updated_at || now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`
        )
        .join('')
    : ''
  }

  ${venues && venues.length > 0
    ? venues
        .map(
          (venue) => `
  <!-- Venue: ${venue.slug} -->
  <url>
    <loc>${baseUrl}/venue/${venue.slug}</loc>
    <lastmod>${venue.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
        )
        .join('')
    : ''
  }
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
