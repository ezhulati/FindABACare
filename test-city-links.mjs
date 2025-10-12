import { chromium } from 'playwright';

const cities = [
  { name: 'New York', url: 'https://findaba.care/ny/new-york' },
  { name: 'Los Angeles', url: 'https://findaba.care/ca/los-angeles' },
  { name: 'Chicago', url: 'https://findaba.care/il/chicago' },
  { name: 'Houston', url: 'https://findaba.care/tx/houston' },
  { name: 'Phoenix', url: 'https://findaba.care/az/phoenix' },
  { name: 'Philadelphia', url: 'https://findaba.care/pa/philadelphia' },
  { name: 'San Antonio', url: 'https://findaba.care/tx/san-antonio' },
  { name: 'San Diego', url: 'https://findaba.care/ca/san-diego' },
  { name: 'Dallas', url: 'https://findaba.care/tx/dallas' },
  { name: 'San Jose', url: 'https://findaba.care/ca/san-jose' },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Testing city pages...\n');

for (const city of cities) {
  try {
    await page.goto(city.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const finalUrl = page.url();
    const title = await page.title();

    if (finalUrl !== city.url) {
      console.log(`❌ ${city.name}: REDIRECTED`);
      console.log(`   Expected: ${city.url}`);
      console.log(`   Got: ${finalUrl}`);
    } else {
      console.log(`✅ ${city.name}: OK (${title})`);
    }
  } catch (error) {
    console.log(`❌ ${city.name}: ERROR - ${error.message}`);
  }
}

await browser.close();
