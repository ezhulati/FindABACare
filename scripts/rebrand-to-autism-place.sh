#!/bin/bash
# Rebrand from findaba.care → autism.place

echo "🎨 Rebranding to autism.place..."

# Files to update (excluding .git, node_modules, docs)
find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) \
  -exec sed -i '' 's/findaba\.care/autism.place/g' {} \;

find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) \
  -exec sed -i '' 's/findABA\.care/autism.place/g' {} \;

# Update public files
sed -i '' 's/findaba\.care/autism.place/g' public/site.webmanifest
sed -i '' 's/findABA\.care/autism.place/g' public/site.webmanifest
sed -i '' 's/findaba\.care/autism.place/g' public/robots.txt

echo "✅ Rebrand complete!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test locally: npm run dev"
echo "3. Add domain in Vercel"
echo "4. Update Supabase auth URLs"
echo "5. Update Google Maps API"
echo "6. Configure Resend email"
