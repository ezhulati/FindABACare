/**
 * SEO Audit Script
 *
 * Audits all pages for proper SEO meta descriptions
 * Run with: npx tsx scripts/audit-seo.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SEOIssue {
  file: string;
  issues: string[];
  hasTitle: boolean;
  hasDescription: boolean;
  titleLength?: number;
  descriptionLength?: number;
}

async function auditSEO() {
  console.log('🔍 Starting SEO Audit for findABA.care\n');

  // Find all .astro pages using find command
  const { stdout } = await execAsync('find src/pages -name "*.astro" -type f | grep -v "/api/"');
  const pages = stdout.trim().split('\n').filter(Boolean);

  const results: SEOIssue[] = [];
  let totalPages = 0;
  let pagesWithIssues = 0;

  for (const pagePath of pages) {
    totalPages++;
    const content = fs.readFileSync(pagePath, 'utf-8');
    const issues: string[] = [];

    // Check for title
    const hasTitle =
      content.includes('title={') ||
      content.includes('<title>') ||
      content.includes('generateCityTitle') ||
      content.includes('generateVenueTitle') ||
      content.includes('SEO_TEMPLATES');

    // Check for description
    const hasDescription =
      content.includes('description={') ||
      content.includes('<meta name="description"') ||
      content.includes('generateCityDescription') ||
      content.includes('generateVenueDescription') ||
      content.includes('SEO_TEMPLATES');

    // Check for SEO utility usage
    const usesSEOUtility = content.includes('from \'../lib/seo\'') || content.includes('from \'../../lib/seo\'');

    if (!hasTitle) {
      issues.push('Missing title tag');
    }

    if (!hasDescription) {
      issues.push('Missing meta description');
    }

    if (!usesSEOUtility && !content.includes('API') && !content.includes('admin')) {
      issues.push('Not using SEO utility (recommend using checkSEOInDev)');
    }

    // Extract title and description if they're static
    const titleMatch = content.match(/title=['"]([^'"]+)['"]/);
    const descMatch = content.match(/description=['"]([^'"]+)['"]/);

    const titleLength = titleMatch ? titleMatch[1].length : undefined;
    const descriptionLength = descMatch ? descMatch[1].length : undefined;

    if (titleLength && (titleLength < 30 || titleLength > 60)) {
      issues.push(`Title length ${titleLength} chars (optimal: 50-60)`);
    }

    if (descriptionLength && (descriptionLength < 120 || descriptionLength > 160)) {
      issues.push(`Description length ${descriptionLength} chars (optimal: 150-160)`);
    }

    if (issues.length > 0) {
      pagesWithIssues++;
      results.push({
        file: pagePath,
        issues,
        hasTitle,
        hasDescription,
        titleLength,
        descriptionLength,
      });
    }
  }

  // Print results
  console.log(`📊 Audit Results:`);
  console.log(`   Total pages: ${totalPages}`);
  console.log(`   Pages with issues: ${pagesWithIssues}`);
  console.log(`   Pages compliant: ${totalPages - pagesWithIssues}\n`);

  if (results.length > 0) {
    console.log('❌ Pages with SEO Issues:\n');

    for (const result of results) {
      const relPath = result.file.replace('src/pages/', '');
      console.log(`📄 ${relPath}`);

      for (const issue of result.issues) {
        console.log(`   ⚠️  ${issue}`);
      }

      if (result.titleLength) {
        console.log(`   📏 Title: ${result.titleLength} chars`);
      }

      if (result.descriptionLength) {
        console.log(`   📏 Description: ${result.descriptionLength} chars`);
      }

      console.log('');
    }

    console.log('\n💡 To fix these issues:');
    console.log('1. Import SEO utility: import { checkSEOInDev } from "../lib/seo"');
    console.log('2. Use templates from SEO_TEMPLATES or generate functions');
    console.log('3. Call checkSEOInDev() to validate in development');
    console.log('4. See docs/SEO-GUIDELINES.md for full documentation\n');
  } else {
    console.log('✅ All pages have proper SEO meta tags!\n');
  }

  // Summary
  const complianceRate = ((totalPages - pagesWithIssues) / totalPages * 100).toFixed(1);
  console.log(`📈 SEO Compliance Rate: ${complianceRate}%`);

  if (pagesWithIssues > 0) {
    process.exit(1);
  }
}

auditSEO().catch((error) => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
