// Manual test to verify fullscreen map z-index fix
// Run with: node manual-test.js

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to Dallas page...');
  await page.goto('http://localhost:4321/tx/dallas', { waitUntil: 'networkidle2' });

  console.log('Taking before screenshot...');
  await page.screenshot({ path: 'before-fullscreen.png', fullPage: true });

  console.log('Clicking expand button...');
  const expandButton = await page.waitForSelector('button[aria-label="Expand map"]');
  await expandButton.click();

  await page.waitForTimeout(1000);

  console.log('Taking after screenshot...');
  await page.screenshot({ path: 'after-fullscreen.png', fullPage: true });

  console.log('Checking if main grid is hidden...');
  const mainGrid = await page.$('.grid.grid-cols-1.lg\\:grid-cols-4');
  const gridDisplay = await mainGrid.evaluate(el => window.getComputedStyle(el).display);
  console.log('Main grid display:', gridDisplay);

  console.log('Checking if modal is visible...');
  const modal = await page.$('.fixed.inset-0.z-\\[9999\\]');
  const modalVisible = await modal.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  console.log('Modal visible:', modalVisible);

  if (gridDisplay === 'none' && modalVisible) {
    console.log('\n✅ SUCCESS! Main grid is hidden and modal is visible.');
    console.log('Venue cards should NOT be visible on top of the map.');
  } else {
    console.log('\n❌ FAILED! Issue persists.');
    console.log(`Grid display: ${gridDisplay} (expected: "none")`);
    console.log(`Modal visible: ${modalVisible} (expected: true)`);
  }

  console.log('\nScreenshots saved: before-fullscreen.png, after-fullscreen.png');
  console.log('Press Ctrl+C to close the browser...');

  // Keep browser open for manual inspection
  await new Promise(() => {});
})();
