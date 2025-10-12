// Visual test to check the fullscreen map layout
// Run with: node visual-test.js

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting visual test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('📍 Navigating to Dallas page...');
  await page.goto('http://localhost:4321/tx/dallas', { waitUntil: 'networkidle' });

  console.log('📸 Taking initial screenshot...');
  await page.screenshot({ path: 'visual-test-before.png', fullPage: true });
  console.log('   ✓ Saved: visual-test-before.png\n');

  // Check initial layout
  const mapExists = await page.locator('button[aria-label="Expand map"]').count();
  console.log(`🗺️  Map expand button found: ${mapExists > 0 ? '✓ YES' : '✗ NO'}`);

  const venuesGrid = await page.locator('#venues-grid').count();
  console.log(`📋 Venues grid found: ${venuesGrid > 0 ? '✓ YES' : '✗ NO'}`);

  console.log('\n🖱️  Clicking expand button...');
  const expandButton = page.locator('button[aria-label="Expand map"]');
  await expandButton.click();

  await page.waitForTimeout(1000);

  console.log('📸 Taking fullscreen screenshot...');
  await page.screenshot({ path: 'visual-test-fullscreen.png', fullPage: true });
  console.log('   ✓ Saved: visual-test-fullscreen.png\n');

  // Check fullscreen modal
  const modal = page.locator('.fixed.inset-0.z-\\[9999\\]');
  const modalVisible = await modal.isVisible();
  console.log(`🪟 Fullscreen modal visible: ${modalVisible ? '✓ YES' : '✗ NO'}`);

  // Get z-index values
  const modalZIndex = await modal.evaluate(el => window.getComputedStyle(el).zIndex);
  console.log(`   Modal z-index: ${modalZIndex}`);

  const grid = page.locator('#venues-grid');
  const gridZIndex = await grid.evaluate(el => window.getComputedStyle(el).zIndex);
  console.log(`   Grid z-index: ${gridZIndex}`);

  // Check if close button is visible
  const closeButton = page.locator('button[aria-label="Close fullscreen"]');
  const closeVisible = await closeButton.isVisible();
  console.log(`\n❌ Close button visible: ${closeVisible ? '✓ YES' : '✗ NO'}`);

  if (modalVisible && parseInt(modalZIndex) > (parseInt(gridZIndex) || 0)) {
    console.log('\n✅ SUCCESS! Fullscreen modal has higher z-index than venue grid.');
    console.log('   Venue cards should NOT be visible on top of the map.\n');
  } else {
    console.log('\n⚠️  WARNING: Z-index may not be correct.');
    console.log(`   Modal: ${modalZIndex}, Grid: ${gridZIndex}\n`);
  }

  console.log('🎬 Browser will stay open for manual inspection.');
  console.log('   Press Ctrl+C in terminal to close.\n');

  // Keep browser open
  await new Promise(() => {});
})();
