#!/bin/bash
set -e

echo "🔧 Setting up Vercel environment variables..."
echo ""
echo "This script will add all required environment variables to your Vercel project."
echo ""

# Load environment variables from .env
source .env

echo "📝 Adding environment variables to Vercel Production..."

# Add Supabase variables
echo "PUBLIC_SUPABASE_URL" | npx vercel env add PUBLIC_SUPABASE_URL production <<< "$PUBLIC_SUPABASE_URL" || echo "✓ PUBLIC_SUPABASE_URL already exists"
echo "PUBLIC_SUPABASE_ANON_KEY" | npx vercel env add PUBLIC_SUPABASE_ANON_KEY production <<< "$PUBLIC_SUPABASE_ANON_KEY" || echo "✓ PUBLIC_SUPABASE_ANON_KEY already exists"
echo "SUPABASE_URL" | npx vercel env add SUPABASE_URL production <<< "$SUPABASE_URL" || echo "✓ SUPABASE_URL already exists"
echo "SUPABASE_ANON_KEY" | npx vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY" || echo "✓ SUPABASE_ANON_KEY already exists"
echo "SUPABASE_SERVICE_ROLE_KEY" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY" || echo "✓ SUPABASE_SERVICE_ROLE_KEY already exists"

# Add Google Maps API key
echo "PUBLIC_GOOGLE_MAPS_API_KEY" | npx vercel env add PUBLIC_GOOGLE_MAPS_API_KEY production <<< "$PUBLIC_GOOGLE_MAPS_API_KEY" || echo "✓ PUBLIC_GOOGLE_MAPS_API_KEY already exists"
echo "GOOGLE_MAPS_API_KEY" | npx vercel env add GOOGLE_MAPS_API_KEY production <<< "$GOOGLE_MAPS_API_KEY" || echo "✓ GOOGLE_MAPS_API_KEY already exists"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🚀 Triggering redeployment..."
npx vercel --prod

echo ""
echo "✅ Done! Your site should be live in about 1 minute."
