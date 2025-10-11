const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:4321/venue/perot-museum-of-nature-and-science');
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();