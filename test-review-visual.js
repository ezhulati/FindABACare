import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to Dallas page...');
    await page.goto('http://localhost:4321/tx/dallas');
    await page.waitForTimeout(2000);

    console.log('2. Clicking on Perot Museum venue...');
    const venueLink = page.locator('a[href*="perot-museum"]').first();
    await venueLink.click();
    await page.waitForTimeout(2000);

    console.log('3. Current URL:', page.url());

    // Take screenshot of venue page
    await page.screenshot({ path: 'screenshot-1-venue-page.png', fullPage: true });
    console.log('   Screenshot saved: screenshot-1-venue-page.png');

    console.log('4. Looking for Write a review button...');
    const reviewButton = page.locator('text=Write a review');
    const buttonCount = await reviewButton.count();
    console.log('   Found', buttonCount, 'review buttons');

    if (buttonCount > 0) {
      const href = await reviewButton.getAttribute('href');
      console.log('   Review button href:', href);

      console.log('5. Clicking Write a review button...');
      await reviewButton.click();
      await page.waitForTimeout(2000);

      console.log('6. After click URL:', page.url());

      // Take screenshot of login page
      await page.screenshot({ path: 'screenshot-2-login-page.png', fullPage: true });
      console.log('   Screenshot saved: screenshot-2-login-page.png');

      // Check what's on the page
      const pageTitle = await page.title();
      const h1Text = await page.locator('h1').first().textContent();
      console.log('   Page title:', pageTitle);
      console.log('   H1 text:', h1Text);

      // Look for email input
      const emailInput = page.locator('input[type="email"]');
      const emailCount = await emailInput.count();
      console.log('   Email inputs found:', emailCount);

      if (emailCount > 0) {
        console.log('✅ SUCCESS: Login page loaded correctly!');
        console.log('   The review button now works and redirects to the login page.');
      } else {
        console.log('❌ ISSUE: Email input not found on the page');
      }
    } else {
      console.log('❌ No review button found on the page');
    }

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
