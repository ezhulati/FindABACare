# SEO Guidelines for findABA.care

This document outlines the SEO best practices and requirements for all pages on findABA.care.

## Meta Description Requirements

### Title Tags

**Character Limit:** 50-60 characters (Google truncates at ~60)

**Format:**
```
[Page Topic] - [Location if applicable] | findABA.care
```

**Examples:**
- ✅ `Dallas, TX Autism-Friendly Venues | findABA.care` (53 chars)
- ✅ `About findABA.care - Our Mission for Autism Families` (54 chars)
- ❌ `Welcome to findABA.care - The Best Place to Find Autism-Friendly Venues and Events` (86 chars - TOO LONG)

### Meta Descriptions

**Character Limit:** 150-160 characters (Google truncates at ~160)

**Requirements:**
- Include primary keyword naturally
- Make it compelling and actionable
- Include a call-to-action when appropriate
- Mention location for local pages
- Highlight unique value proposition

**Examples:**
- ✅ `Find 205 sensory-friendly venues, quiet hours, and micro-events in Dallas, Texas. Parent-verified places that work for your child with autism.` (149 chars)
- ✅ `Discover sensory-friendly venues, quiet hours, and parent-verified places for children with autism in Dallas and Houston. Real experiences from real families.` (160 chars)
- ❌ `This is our website` (19 chars - TOO SHORT)
- ❌ `Welcome to findABA.care where we help families find places that are autism-friendly and sensory-friendly with accommodations like quiet hours, visual supports, and more across Dallas, Houston, and other cities` (213 chars - TOO LONG)

## Using the SEO Utility

### Import the utility

```typescript
import {
  SEO_TEMPLATES,
  generateCityTitle,
  generateCityDescription,
  checkSEOInDev
} from '../lib/seo';
```

### For new pages

1. **Use existing templates when available:**

```astro
---
import { SEO_TEMPLATES, checkSEOInDev } from '../lib/seo';

const { title, description } = SEO_TEMPLATES.home;
checkSEOInDev({ title, description }, '/');
---

<Base title={title} description={description}>
  <!-- Your content -->
</Base>
```

2. **For dynamic pages (cities, venues):**

```astro
---
import { generateCityTitle, generateCityDescription, checkSEOInDev } from '../lib/seo';

const title = generateCityTitle(cityName, state);
const description = generateCityDescription(cityName, stateName, venueCount);

checkSEOInDev({ title, description }, `/tx/${city}`);
---

<Base title={title} description={description}>
  <!-- Your content -->
</Base>
```

3. **For custom pages:**

```astro
---
import { checkSEOInDev } from '../lib/seo';

const title = 'Your Custom Title (50-60 chars) | findABA.care';
const description = 'Your custom description that explains what this page is about in 150-160 characters. Be compelling!';

checkSEOInDev({ title, description }, '/your-page');
---

<Base title={title} description={description}>
  <!-- Your content -->
</Base>
```

## Development Mode Validation

The `checkSEOInDev()` function automatically validates your meta tags during development:

```
🔍 SEO Check: /tx/dallas
Title: Dallas, TX Autism-Friendly Venues | findABA.care (53 chars)
Description: Find 205 sensory-friendly venues... (149 chars)
```

### Errors vs Warnings

**Errors** (must be fixed before deployment):
- Title > 70 characters
- Description > 170 characters
- Missing title or description

**Warnings** (should be addressed):
- Title < 50 characters (too short)
- Description < 150 characters (too short)
- Missing brand name in title
- Description < 15 words

## Available SEO Templates

Pre-built templates for common pages:

### `SEO_TEMPLATES.home`
```typescript
{
  title: 'findABA.care - Find Autism-Friendly Places for Your Child',
  description: 'Discover sensory-friendly venues, quiet hours, and parent-verified places for children with autism in Dallas and Houston. Real experiences from real families.'
}
```

### `SEO_TEMPLATES.about`
```typescript
{
  title: 'About findABA.care - Our Mission for Autism Families',
  description: 'findABA.care helps families find autism-friendly venues through parent verification and community reviews. Safe, sensory-friendly places that work for your child.'
}
```

### `SEO_TEMPLATES.stateDirectory(stateName)`
```typescript
{
  title: `${stateName} Autism-Friendly Venues & Events | findABA.care`,
  description: `Browse autism-friendly venues and sensory-friendly events across ${stateName}. Parent-verified places with quiet hours, visual supports, and accommodations.`
}
```

### `SEO_TEMPLATES.events(cityName, state)`
```typescript
{
  title: `${cityName}, ${state} Autism-Friendly Events | findABA.care`,
  description: `Find micro-events, sensory-friendly activities, and autism-friendly gatherings in ${cityName}. Small groups, predictable schedules, parent-verified experiences.`
}
```

### `SEO_TEMPLATES.calmWindows(cityName, state)`
```typescript
{
  title: `${cityName}, ${state} Calm Windows - Quiet Hours | findABA.care`,
  description: `Discover quiet hours and calm windows at ${cityName} venues. Reduced sensory input, lower crowds, and autism-friendly shopping times. Parent-verified schedules.`
}
```

## Helper Functions

### `truncateAtWord(text, maxLength)`
Truncates text while preserving word boundaries:

```typescript
truncateAtWord('This is a very long description that needs truncating', 30)
// Returns: "This is a very long…"
```

### `validateSEOMetadata(metadata)`
Validates SEO metadata programmatically:

```typescript
const validation = validateSEOMetadata({ title, description });

if (!validation.valid) {
  console.error('SEO Errors:', validation.errors);
}
```

## Checklist for New Pages

Before pushing a new page to production, ensure:

- [ ] Title is 50-60 characters
- [ ] Description is 150-160 characters
- [ ] Title includes "findABA" or "findABA.care"
- [ ] Description includes primary keyword
- [ ] Description is compelling and actionable
- [ ] `checkSEOInDev()` shows no errors in development
- [ ] Title and description are unique (not duplicated from other pages)
- [ ] Location mentioned for local pages (city/state)

## Testing Your SEO

### Local Development
Run `npm run dev` and check the console for SEO validation messages.

### Production Testing
After deployment, verify:

1. **Google Search Console Preview:**
   - https://search.google.com/test/rich-results

2. **Meta Tag Checker:**
   - View page source
   - Check `<title>` and `<meta name="description">` tags

3. **Social Media Preview:**
   - https://cards-dev.twitter.com/validator
   - https://developers.facebook.com/tools/debug/

## Common Mistakes to Avoid

❌ **Don't:**
- Use generic descriptions like "Welcome to our site"
- Duplicate descriptions across multiple pages
- Stuff keywords unnaturally
- Exceed character limits
- Forget to include location on local pages

✅ **Do:**
- Be specific and descriptive
- Include your primary keyword naturally
- Write for humans, not just search engines
- Test your meta tags in development
- Use the provided templates and helpers

## Questions?

If you need help with SEO for a new page type, check:
1. Existing templates in `src/lib/seo.ts`
2. Similar pages for reference
3. This documentation

For new page types that need templates, add them to `SEO_TEMPLATES` in `src/lib/seo.ts`.
