# Domain Migration: findaba.care → autism.place

**New Brand:** autism.place
**Tagline:** Find autism-friendly places near you

---

## Phase 1: Code Changes ✅ (Claude can do)

### Critical Files to Update:
1. **src/layouts/Base.astro** - Site name, canonical URLs, OG metadata
2. **src/lib/seo.ts** - SEO templates, domain references
3. **src/pages/about.astro** - Brand name, mission statement
4. **src/pages/index.astro** - Homepage content
5. **src/lib/email.ts** - Email templates
6. **public/site.webmanifest** - PWA configuration
7. **public/robots.txt** - Sitemap URL

### All Files with Domain References (47 total):
- src/layouts/Base.astro
- src/lib/seo.ts
- src/pages/about.astro
- src/pages/index.astro
- src/pages/[state]/index.astro
- src/pages/404.astro
- src/pages/cities.astro
- src/pages/admin/index.astro
- src/pages/profile.astro
- src/pages/auth/login.astro
- src/pages/onboarding.astro
- src/pages/venue/[slug]/review.astro
- src/pages/terms.astro
- src/pages/privacy.astro
- src/pages/[state]/[city]/events.astro
- src/lib/email.ts
- src/lib/utils.ts
- src/lib/sms.ts
- src/components/SEO.astro
- public/site.webmanifest
- public/robots.txt
- public/logo-preview.html
- And 27 documentation/config files

---

## Phase 2: External Services 🔧 (You need to do)

### Vercel Setup
1. **Add Domain to Vercel**
   ```bash
   vercel domains add autism.place
   ```
2. **Set as Primary Domain**
   - Go to Project Settings → Domains
   - Add `autism.place`
   - Set as primary
   - Vercel auto-generates SSL certificate

3. **Configure www Redirect**
   - Add `www.autism.place` → redirect to `autism.place`

### DNS Configuration
Update your DNS provider (wherever you bought autism.place):

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Supabase Authentication
1. Go to: https://supabase.com/dashboard/project/gvfkyfzukwnjomksuvaq/auth/url-configuration
2. **Add to Redirect URLs:**
   - `https://autism.place/auth/callback`
   - `https://autism.place/**`
   - Keep old URLs during transition:
     - `https://findaba.care/auth/callback`
     - `https://findaba.care/**`

### Google Maps API
1. Go to: https://console.cloud.google.com/apis/credentials
2. Update HTTP referrers:
   - Add `autism.place/*`
   - Add `*.autism.place/*`
   - Keep `findaba.care/*` during transition

### Resend Email Service
1. Go to: https://resend.com/domains
2. **Add New Domain:** `autism.place`
3. Update DNS records with provided values:
   - TXT record for verification
   - MX records
   - DKIM records
4. Update email templates:
   - From: `hello@autism.place`
   - Update all email content

---

## Phase 3: SEO & Redirects 📈

### 301 Redirects (Keep findaba.care active)
In Vercel project settings or `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "https://findaba.care/:path*",
      "destination": "https://autism.place/:path*",
      "permanent": true
    },
    {
      "source": "https://www.findaba.care/:path*",
      "destination": "https://autism.place/:path*",
      "permanent": true
    }
  ]
}
```

### Google Search Console
1. **Add New Property:**
   - Go to: https://search.google.com/search-console
   - Add `autism.place`
   - Verify ownership (auto-verifies via DNS)

2. **Submit Sitemap:**
   - URL: `https://autism.place/sitemap.xml`

3. **Address Change Tool:**
   - In old property (findaba.care)
   - Use "Change of Address" tool
   - Select new property (autism.place)

### Analytics
If using Google Analytics:
- Update property settings with new domain
- Update tracking code if needed

---

## Phase 4: Testing ✓

### Pre-Launch Checklist:
- [ ] All pages load correctly on autism.place
- [ ] SSL certificate is active (https://)
- [ ] Login/signup works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Map displays correctly
- [ ] Venue pages load
- [ ] Search functionality works
- [ ] Mobile responsive
- [ ] www redirect works

### Post-Launch Monitoring:
- [ ] Check Google Search Console for crawl errors
- [ ] Monitor 404 errors
- [ ] Verify redirects from old domain work
- [ ] Check email deliverability
- [ ] Monitor traffic in analytics

---

## Timeline Estimate

**Total Time:** 2-4 hours

1. **Code changes:** 30 mins (automated)
2. **Vercel setup:** 15 mins
3. **DNS propagation:** 24-48 hours (but often faster)
4. **Supabase/APIs:** 15 mins
5. **Email setup:** 30 mins
6. **Testing:** 1 hour
7. **Search Console:** 15 mins

---

## Rollback Plan

If issues arise:
1. In Vercel, set `findaba.care` back as primary domain
2. Revert code changes (git revert)
3. Keep both domains active until issues resolved

---

## Brand Guidelines

**Old:** findABA.care
**New:** autism.place

**Tagline:** Find autism-friendly places near you

**Domain usage:**
- Primary: `autism.place` (no www)
- Email: `@autism.place`
- Social: autism.place

---

## Status

- [ ] Phase 1: Code changes
- [ ] Phase 2: External services
- [ ] Phase 3: SEO & redirects
- [ ] Phase 4: Testing
- [ ] **LIVE ON autism.place** 🚀
