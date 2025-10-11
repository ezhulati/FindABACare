import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to Dallas page...');
  await page.goto('http://localhost:4321/tx/dallas');
  await page.waitForTimeout(2000);

  console.log('Clicking on first venue...');
  const firstVenueLink = page.locator('article a').first();
  await firstVenueLink.click();
  await page.waitForTimeout(2000);

  console.log('Current URL:', page.url());

  console.log('Looking for Write a review button...');
  const reviewButton = page.locator('text=Write a review');
  const buttonCount = await reviewButton.count();
  console.log('Found', buttonCount, 'review buttons');

  if (buttonCount > 0) {
    const href = await reviewButton.getAttribute('href');
    console.log('Review button href:', href);

    console.log('Clicking Write a review...');
    await reviewButton.click();
    await page.waitForTimeout(2000);

    console.log('After click URL:', page.url());
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
