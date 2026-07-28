import { test, expect } from '@playwright/test';

const sites = [
  {
    name: 'Gmail',
    url: 'https://mail.google.com',
    expectedPattern: /mail\.google\.com/,
    expectedText: /Gmail|Google/i,
  },
  {
    name: 'Yahoo Mail',
    url: 'https://mail.yahoo.com',
    expectedPattern: /mail\.yahoo\.com/,
    expectedText: /Yahoo|Mail/i,
  },
  {
    name: 'Example site',
    url: 'https://example.com',
    expectedPattern: /example\.com/,
    expectedText: /Example Domain/i,
  },
];

test.describe('Multiple site access demo', () => {
  for (const site of sites) {
    test(`opens ${site.name}`, async ({ page }) => {
      await page.goto(site.url, { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL(site.expectedPattern);
      await expect(page.locator('body')).toContainText(site.expectedText);

      console.log(`Connected successfully to ${site.name}: ${site.url}`);
    });
  }
});
