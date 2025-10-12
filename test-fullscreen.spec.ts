import { test, expect } from '@playwright/test';

test('fullscreen map z-index test', async ({ page }) => {
  // Navigate to a city page
  await page.goto('http://localhost:4321/tx/dallas');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/before-fullscreen.png', fullPage: true });

  // Find and click the expand button
  const expandButton = page.locator('button[aria-label="Expand map"]');
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  // Wait for fullscreen modal to appear
  await page.waitForTimeout(500);

  // Take fullscreen screenshot
  await page.screenshot({ path: '/tmp/after-fullscreen.png', fullPage: true });

  // Check if fullscreen modal is visible
  const fullscreenModal = page.locator('.fixed.inset-0.z-\\[9999\\]');
  await expect(fullscreenModal).toBeVisible();

  // Check if venue cards are still visible (they shouldn't be on top)
  const venuesGrid = page.locator('#venues-grid');
  const gridBox = await venuesGrid.boundingBox();

  console.log('Fullscreen modal exists:', await fullscreenModal.count() > 0);
  console.log('Venues grid box:', gridBox);

  // Get computed z-index
  const modalZIndex = await fullscreenModal.evaluate((el) => {
    return window.getComputedStyle(el).zIndex;
  });

  const gridZIndex = await venuesGrid.evaluate((el) => {
    return window.getComputedStyle(el).zIndex;
  });

  console.log('Modal z-index:', modalZIndex);
  console.log('Grid z-index:', gridZIndex);

  // Modal z-index should be higher
  expect(parseInt(modalZIndex)).toBeGreaterThan(parseInt(gridZIndex) || 0);
});
